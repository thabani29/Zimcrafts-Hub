import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { Surface, Text, IconButton, Divider, SegmentedButtons } from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import CategoryPicker from "../../components/CategoryPicker";
import ScreenShell from "../../components/ScreenShell";

const emptyQuestion = { questionText: "", type: "mcq", options: ["", "", ""], correctAnswer: "" };
const emptyLesson = { title: "", type: "text", contentUrl: "", duration: "", examQuestions: [{ ...emptyQuestion }] };

export default function UploadTutorialScreen({ route, navigation }) {
  const tutorialId = route.params?.tutorialId;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
  });
  const [lessons, setLessons] = useState([{ ...emptyLesson }]);
  const [finalExamQuestions, setFinalExamQuestions] = useState([{ ...emptyQuestion }]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLesson, setUploadingLesson] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (tutorialId) {
      loadTutorial();
    } else {
      setLoading(false);
    }
  }, [tutorialId]);

  const fetchCategories = async () => {
    try {
      const response = await client.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const loadTutorial = async () => {
    try {
      setLoading(true);
      const response = await client.getTutorialById(tutorialId);
      
      const tut = response?.data || response;
      
      if (!tut || typeof tut !== "object") {
        throw new Error("Could not find tutorial details in the server response.");
      }

      setFormData({
        title: tut.title || "",
        description: tut.description || "",
        price: tut.price !== undefined ? String(tut.price) : "",
        category: tut.category?._id || tut.category || "",
      });

      if (tut.lessons?.length > 0) {
        setLessons(tut.lessons.map(l => ({
          title: l.title || "",
          type: l.type || "text",
          contentUrl: l.contentUrl || "",
          duration: String(l.duration || ""),
          examQuestions: l.exam?.questions?.length > 0 
            ? l.exam.questions.map(q => ({
                questionText: q.questionText || "",
                type: q.type || "mcq",
                options: q.options || ["", "", ""],
                correctAnswer: q.correctAnswer || ""
              }))
            : [{ ...emptyQuestion }]
        })));
      }

      if (tut.exam?.questions?.length > 0) {
        setFinalExamQuestions(tut.exam.questions.map(q => ({
          questionText: q.questionText || "",
          type: q.type || "mcq",
          options: q.options || ["", "", ""],
          correctAnswer: q.correctAnswer || ""
        })));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load tutorial details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const addLesson = () => setLessons([...lessons, { ...emptyLesson }]);
  const removeLesson = (index) => {
    if (lessons.length > 1) setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleLessonChange = (index, field, value) => {
    const updated = [...lessons];
    updated[index][field] = value;
    setLessons(updated);
  };

  const addLessonQuestion = (lIdx) => {
    const updated = [...lessons];
    updated[lIdx].examQuestions.push({ ...emptyQuestion });
    setLessons(updated);
  };

  const handleLessonQuestionChange = (lIdx, qIdx, field, value) => {
    const updated = [...lessons];
    updated[lIdx].examQuestions[qIdx][field] = value;
    setLessons(updated);
  };

  const handleLessonQuestionOptionChange = (lIdx, qIdx, oIdx, value) => {
    const updated = [...lessons];
    updated[lIdx].examQuestions[qIdx].options[oIdx] = value;
    setLessons(updated);
  };

  const addFinalQuestion = () => setFinalExamQuestions([...finalExamQuestions, { ...emptyQuestion }]);
  const handleFinalQuestionChange = (qIdx, field, value) => {
    const updated = [...finalExamQuestions];
    updated[qIdx][field] = value;
    setFinalExamQuestions(updated);
  };

  const handleFinalQuestionOptionChange = (qIdx, oIdx, value) => {
    const updated = [...finalExamQuestions];
    updated[qIdx].options[oIdx] = value;
    setFinalExamQuestions(updated);
  };

  const pickVideo = async (lIdx) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "video/*" });
      if (!result.canceled) {
        const file = result.assets[0];
        setUploadingLesson(lIdx);
        const uploadResult = await client.uploadTutorialVideo({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "video/mp4",
        });
        handleLessonChange(lIdx, "contentUrl", uploadResult.url);
        Alert.alert("Success", "Video uploaded successfully!");
      }
    } catch (error) {
      Alert.alert("Upload failed", error.message);
    } finally {
      setUploadingLesson(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      Alert.alert("Error", "Please fill in title, price, and category.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        price: Number(formData.price),
        lessons: lessons.map(l => ({
          title: l.title,
          type: l.type,
          contentUrl: l.contentUrl,
          duration: Number(l.duration) || 0,
          exam: {
            questions: l.examQuestions
              .filter(q => q.questionText.trim())
              .map(q => ({
                questionText: q.questionText,
                type: q.type,
                options: q.type === "mcq" ? q.options.filter(Boolean) : [],
                correctAnswer: q.correctAnswer
              }))
          }
        })),
        exam: {
          questions: finalExamQuestions
            .filter(q => q.questionText.trim())
            .map(q => ({
              questionText: q.questionText,
              type: q.type,
              options: q.type === "mcq" ? q.options.filter(Boolean) : [],
              correctAnswer: q.correctAnswer
            }))
        }
      };

      if (tutorialId) {
        await client.updateTutorial(tutorialId, payload);
        Alert.alert("Success", "Tutorial updated successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await client.createTutorial(payload);
        Alert.alert("Success", "Tutorial created successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert("Submission failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <Text variant="bodyLarge" style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
        ) : (
          <View style={{ gap: 20 }}>
            <Surface style={styles.card} elevation={1}>
              <Text variant="titleLarge" style={styles.title}>
                {tutorialId ? "Edit Tutorial" : "New Tutorial"}
              </Text>
              
              <AppTextField label="Title *" value={formData.title} onChangeText={(v) => setFormData({ ...formData, title: v })} />
              <AppTextField label="Description *" value={formData.description} onChangeText={(v) => setFormData({ ...formData, description: v })} multiline numberOfLines={3} />
              
              <View style={styles.row}>
                <AppTextField label="Price ($) *" value={formData.price} onChangeText={(v) => setFormData({ ...formData, price: v })} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>

              <CategoryPicker
                categories={categories}
                selectedId={formData.category}
                onSelect={(id) => setFormData({ ...formData, category: id })}
              />
            </Surface>

            <Text variant="titleMedium" style={styles.sectionHeader}>Lessons</Text>
            {lessons.map((lesson, lIdx) => (
              <Surface key={`lesson-${lIdx}`} style={styles.card} elevation={1}>
                <View style={styles.headerRow}>
                  <Text variant="titleSmall">Lesson {lIdx + 1}</Text>
                  {lessons.length > 1 && <IconButton icon="delete" size={20} iconColor="red" onPress={() => removeLesson(lIdx)} />}
                </View>
                
                <AppTextField label="Lesson Title *" value={lesson.title} onChangeText={(v) => handleLessonChange(lIdx, "title", v)} />
                <AppTextField label="Duration (mins)" value={lesson.duration} onChangeText={(v) => handleLessonChange(lIdx, "duration", v)} keyboardType="numeric" />
                
                <SegmentedButtons
                  value={lesson.type}
                  onValueChange={(v) => handleLessonChange(lIdx, "type", v)}
                  buttons={[{ value: "text", label: "Text" }, { value: "video", label: "Video" }]}
                />

                {lesson.type === "video" ? (
                  <View style={styles.uploadArea}>
                    <AppButton 
                      mode="outlined" 
                      loading={uploadingLesson === lIdx} 
                      disabled={uploadingLesson !== null}
                      onPress={() => pickVideo(lIdx)}
                    >
                      {lesson.contentUrl ? "Change Video" : "Upload Video"}
                    </AppButton>
                    {lesson.contentUrl ? <Text variant="labelSmall" style={{ color: "green", marginTop: 4 }}>Video Uploaded</Text> : null}
                  </View>
                ) : (
                  <AppTextField label="Content Text" value={lesson.contentUrl} onChangeText={(v) => handleLessonChange(lIdx, "contentUrl", v)} multiline numberOfLines={3} />
                )}

                <Divider style={{ marginVertical: 8 }} />
                <Text variant="labelLarge">Lesson Exam Questions</Text>
                {lesson.examQuestions.map((q, qIdx) => (
                  <View key={`l-${lIdx}-q-${qIdx}`} style={styles.questionBlock}>
                    <AppTextField label={`Question ${qIdx + 1}`} value={q.questionText} onChangeText={(v) => handleLessonQuestionChange(lIdx, qIdx, "questionText", v)} />
                    {q.type === "mcq" && (
                      <View style={styles.optionsGrid}>
                        {q.options.map((opt, oIdx) => (
                          <AppTextField key={`o-${oIdx}`} label={`Opt ${oIdx + 1}`} value={opt} onChangeText={(v) => handleLessonQuestionOptionChange(lIdx, qIdx, oIdx, v)} containerStyle={{ width: "48%" }} />
                        ))}
                      </View>
                    )}
                    <AppTextField label="Correct Answer" value={q.correctAnswer} onChangeText={(v) => handleLessonQuestionChange(lIdx, qIdx, "correctAnswer", v)} />
                  </View>
                ))}
                <AppButton mode="text" onPress={() => addLessonQuestion(lIdx)}>+ Add Question</AppButton>
              </Surface>
            ))}
            <AppButton mode="outlined" onPress={addLesson}>+ Add Lesson</AppButton>

            <Text variant="titleMedium" style={styles.sectionHeader}>Final Exam</Text>
            <Surface style={styles.card} elevation={1}>
              {finalExamQuestions.map((q, qIdx) => (
                <View key={`final-q-${qIdx}`} style={styles.questionBlock}>
                  <AppTextField label={`Question ${qIdx + 1}`} value={q.questionText} onChangeText={(v) => handleFinalQuestionChange(qIdx, "questionText", v)} />
                  {q.type === "mcq" && (
                    <View style={styles.optionsGrid}>
                      {q.options.map((opt, oIdx) => (
                        <AppTextField key={`fo-${oIdx}`} label={`Opt ${oIdx + 1}`} value={opt} onChangeText={(v) => handleFinalQuestionOptionChange(qIdx, oIdx, v)} containerStyle={{ width: "48%" }} />
                      ))}
                    </View>
                  )}
                  <AppTextField label="Correct Answer" value={q.correctAnswer} onChangeText={(v) => handleFinalQuestionChange(qIdx, "correctAnswer", v)} />
                </View>
              ))}
              <AppButton mode="text" onPress={addFinalQuestion}>+ Add Final Question</AppButton>
            </Surface>

            <AppButton loading={submitting} disabled={submitting || uploadingLesson !== null} onPress={handleSubmit} style={{ marginTop: 10 }}>
              {tutorialId ? "Save Changes" : "Create Tutorial"}
            </AppButton>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionHeader: {
    fontWeight: "bold",
    color: "#432818",
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  uploadArea: {
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
  },
  questionBlock: {
    marginTop: 8,
    gap: 8,
    padding: 8,
    backgroundColor: "#f9f3e9",
    borderRadius: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },
});

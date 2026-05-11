import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Surface, Text, RadioButton, Divider } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import LoadingState from "../../components/LoadingState";

export default function ExamScreen({ route, navigation }) {
  const { tutorialId, lessonIdx } = route.params;
  const isLessonQuiz = lessonIdx !== undefined;
  
  const [loading, setLoading] = useState(true);
  const [tutorial, setTutorial] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExam();
  }, [tutorialId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const res = await client.getTutorialById(tutorialId);
      setTutorial(res.data || res);
    } catch (error) {
      Alert.alert("Error", "Failed to load questions.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const questions = isLessonQuiz 
    ? tutorial?.lessons?.[lessonIdx]?.exam?.questions || []
    : tutorial?.exam?.questions || [];

  const calculateScore = () => {
    if (questions.length === 0) return 100;

    let correct = 0;
    questions.forEach((q, idx) => {
      const userAnswer = (answers[idx] || "").toString().trim().toLowerCase();
      const correctAnswer = (q.correctAnswer || "").toString().trim().toLowerCase();
      
      if (userAnswer === correctAnswer) {
        correct++;
      }
    });

    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const score = calculateScore();
      
      if (isLessonQuiz) {
        Alert.alert(
          score >= 70 ? "Passed!" : "Try Again",
          `You scored ${score}% on this lesson quiz.`,
          [{ text: "Continue", onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.replace("Result", { 
          tutorialId, 
          score, 
          passingScore: 70 
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading questions..." />;

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.card} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>
            {isLessonQuiz ? "Lesson Quiz" : "Final Examination"}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isLessonQuiz ? tutorial?.lessons?.[lessonIdx]?.title : tutorial?.title}
          </Text>
          <Text variant="bodySmall" style={styles.info}>
            Answer all {questions.length} questions to proceed.
          </Text>
          
          <Divider style={styles.divider} />

          {questions.length > 0 ? (
            questions.map((q, idx) => (
              <View key={idx} style={styles.questionBlock}>
                <Text variant="titleSmall" style={styles.questionText}>
                  {idx + 1}. {q.questionText}
                </Text>
                
                {q.type === "mcq" ? (
                  <RadioButton.Group
                    onValueChange={value => setAnswers({ ...answers, [idx]: value })}
                    value={answers[idx]}
                  >
                    {q.options?.map((opt, optIdx) => (
                      <RadioButton.Item 
                        key={optIdx} 
                        label={opt} 
                        value={opt} 
                        color="#8a4b2a"
                        labelStyle={styles.optionLabel}
                      />
                    ))}
                  </RadioButton.Group>
                ) : (
                  <AppTextField
                    label="Your Answer"
                    placeholder="Type your answer here..."
                    value={answers[idx] || ""}
                    onChangeText={value => setAnswers({ ...answers, [idx]: value })}
                    multiline={q.questionText.length > 50}
                  />
                )}
              </View>
            ))
          ) : (
            <View style={styles.noQuestions}>
              <Text variant="bodyLarge">No questions defined for this section.</Text>
            </View>
          )}

          <AppButton 
            onPress={handleSubmit} 
            loading={submitting}
            disabled={submitting || (questions.length > 0 && Object.keys(answers).length < questions.length)}
            style={styles.submitBtn}
          >
            {isLessonQuiz ? "Complete Quiz" : "Submit Final Exam"}
          </AppButton>
        </Surface>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
  },
  title: {
    color: "#432818",
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#8a4b2a",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 4,
  },
  info: {
    textAlign: "center",
    color: "#6b4f3a",
    marginTop: 8,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: "#ead7c0",
  },
  questionBlock: {
    marginBottom: 24,
    backgroundColor: "rgba(234, 215, 192, 0.15)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead7c0",
  },
  questionText: {
    color: "#432818",
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 16,
  },
  optionLabel: {
    color: "#6b4f3a",
    fontSize: 15,
  },
  noQuestions: {
    padding: 40,
    alignItems: "center",
  },
  submitBtn: {
    marginTop: 12,
    borderRadius: 12,
  },
});

import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Surface, Text, Divider, List } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Video, ResizeMode } from "expo-av";
import client from "../../api/client";
import ScreenShell from "../../components/ScreenShell";
import AppButton from "../../components/AppButton";
import LoadingState from "../../components/LoadingState";

export default function CoursePlayerScreen({ route, navigation }) {
  const { tutorialId } = route.params;
  const [loading, setLoading] = useState(true);
  const [tutorial, setTutorial] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const videoRef = React.useRef(null);
  const [status, setStatus] = useState({});

  useEffect(() => {
    loadTutorial();
  }, [tutorialId]);

  const loadTutorial = async () => {
    try {
      setLoading(true);
      const res = await client.getTutorialById(tutorialId);
      const data = res.data || res;
      setTutorial(data);
      if (data.lessons && data.lessons.length > 0) {
        setCurrentLesson(data.lessons[0]);
        setCurrentLessonIdx(0);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load course content.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson, index) => {
    setCurrentLesson(lesson);
    setCurrentLessonIdx(index);
  };

  if (loading) return <LoadingState label="Loading lessons..." />;

  const hasLessonQuiz = currentLesson?.exam?.questions?.length > 0;

  return (
    <ScreenShell scroll={false}>
      <View style={styles.videoContainer}>
        {currentLesson?.type === "video" ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: currentLesson.contentUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
            onError={(e) => Alert.alert("Video Error", "Could not play this video.")}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.textPlayer}>
            <Text variant="titleLarge" style={styles.lessonTitle}>{currentLesson?.title}</Text>
            <Text variant="bodyMedium" style={styles.lessonContent}>
              {currentLesson?.contentUrl || "No content provided for this lesson."}
            </Text>
          </ScrollView>
        )}
      </View>

      <Surface style={styles.curriculumCard} elevation={1}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="headlineSmall" style={styles.title}>{tutorial?.title}</Text>
            {hasLessonQuiz && (
              <AppButton 
                mode="contained" 
                onPress={() => navigation.navigate("Exam", { tutorialId, lessonIdx: currentLessonIdx })}
                style={styles.quizBtn}
                compact
                labelStyle={{ fontSize: 10 }}
              >
                Lesson Quiz
              </AppButton>
            )}
          </View>
          <Text variant="bodyMedium" style={styles.description}>
            Select a lesson below to learn.
          </Text>
        </View>

        <Divider style={styles.divider} />
        
        <ScrollView style={styles.lessonList}>
          {tutorial?.lessons?.map((lesson, index) => (
            <List.Item
              key={index}
              title={lesson.title}
              description={`${lesson.duration || 0} mins • ${lesson.type} ${lesson.exam?.questions?.length > 0 ? "• Quiz included" : ""}`}
              left={props => (
                <List.Icon 
                  {...props} 
                  icon={lesson.type === "video" ? "play-circle" : "file-document"} 
                  color={currentLessonIdx === index ? "#8a4b2a" : "#7c5d48"}
                />
              )}
              onPress={() => handleLessonSelect(lesson, index)}
              style={[
                styles.lessonItem,
                currentLessonIdx === index && styles.activeLesson
              ]}
              titleStyle={currentLessonIdx === index ? styles.activeText : styles.normalText}
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton 
            onPress={() => navigation.navigate("Exam", { tutorialId })} 
            style={styles.examBtn}
          >
            Take Final Exam
          </AppButton>
        </View>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#2b1a10",
    borderRadius: 0,
    overflow: "hidden",
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textPlayer: {
    padding: 24,
    paddingBottom: 40,
  },
  lessonTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
  },
  lessonContent: {
    color: "#ead7c0",
    lineHeight: 24,
  },
  curriculumCard: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fffdf9",
    marginTop: -30,
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  quizBtn: {
    backgroundColor: "#8a4b2a",
  },
  title: {
    color: "#432818",
    fontWeight: "900",
    flex: 1,
  },
  description: {
    color: "#6b4f3a",
    marginTop: 4,
  },
  divider: {
    backgroundColor: "#ead7c0",
  },
  lessonList: {
    flex: 1,
  },
  lessonItem: {
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6db",
  },
  activeLesson: {
    backgroundColor: "rgba(138, 75, 42, 0.08)",
  },
  activeText: {
    color: "#8a4b2a",
    fontWeight: "bold",
  },
  normalText: {
    color: "#432818",
  },
  footer: {
    padding: 20,
    backgroundColor: "#fffdf9",
    borderTopWidth: 1,
    borderTopColor: "#f0e6db",
  },
  examBtn: {
    borderRadius: 12,
  },
});

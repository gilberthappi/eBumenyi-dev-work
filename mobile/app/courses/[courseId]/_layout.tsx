import { Stack } from 'expo-router';

export default function CoursesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="course-intro" options={{ headerShown: false }} />
         <Stack.Screen name="final-test" options={{ headerShown: false }}/>
          <Stack.Screen name="final-exam" options={{ headerShown: false }}/>
        <Stack.Screen name="pre-test" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false }} />
        <Stack.Screen name="[chapterId]" options={{ headerShown: false }} />
    </Stack>
  );
}
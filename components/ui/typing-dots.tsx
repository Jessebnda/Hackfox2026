import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface TypingDotsProps {
  size?: number;
  color?: string;
  dotCount?: number;
  spacing?: number;
}

export default function TypingDots({
  size = 8,
  color = "#555555",
  dotCount = 3,
  spacing = 6,
}: TypingDotsProps) {
  const valuesRef = useRef(
    Array.from({ length: dotCount }, () => new Animated.Value(0.7))
  );

  useEffect(() => {
    const animations = valuesRef.current.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(val, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.7,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((a) => a.start());
    return () => {
      animations.forEach((a) => a.stop());
    };
  }, []);

  return (
    <View style={[styles.row, { columnGap: spacing }]}>
      {valuesRef.current.map((val, idx) => (
        <Animated.View
          key={idx}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale: val }],
            opacity: val.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.6, 1],
            }),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});

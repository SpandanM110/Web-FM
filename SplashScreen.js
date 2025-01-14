import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Rect, Circle, G, Path, Text as SvgText } from 'react-native-svg';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hold the splash screen for 2 seconds
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 2000);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.logoContainer}>
          <Svg width={200} height={200} viewBox="0 0 500 500">
            {/* Black Square Background */}
            <Rect x="0" y="0" width="500" height="500" fill="#000000" />
            
            {/* Circle Background */}
            <Circle cx="250" cy="250" r="220" fill="#1DB954" />
            
            {/* Radio Group */}
            <G transform="translate(0, -20)">
              {/* Radio Outline */}
              <Rect x="150" y="185" width="200" height="160" rx="15" 
                    fill="none" stroke="black" strokeWidth="8"/>
              
              {/* Display Window */}
              <Rect x="170" y="205" width="160" height="40" rx="5" 
                    fill="black"/>
              
              {/* Website Text */}
              <SvgText x="250" y="233"
                    fontFamily="Segoe UI"
                    fontSize="26"
                    fontWeight="800"
                    letterSpacing="1"
                    textAnchor="middle"
                    fill="#1DB954">
                WEB FM
              </SvgText>
              
              {/* Controls */}
              <Circle cx="195" cy="285" r="20" fill="black"/>
              <Circle cx="305" cy="285" r="20" fill="black"/>
              
              {/* Speaker Grille */}
              <Circle cx="195" cy="325" r="3" fill="black"/>
              <Circle cx="215" cy="325" r="3" fill="black"/>
              <Circle cx="235" cy="325" r="3" fill="black"/>
              <Circle cx="255" cy="325" r="3" fill="black"/>
              <Circle cx="275" cy="325" r="3" fill="black"/>
              <Circle cx="295" cy="325" r="3" fill="black"/>
              
              {/* Sound Waves */}
              <Path d="M370 205 Q390 265 370 325" stroke="black" strokeWidth="6" fill="none"/>
              <Path d="M390 185 Q420 265 390 345" stroke="black" strokeWidth="6" fill="none"/>
            </G>
            
            {/* Web FM Text */}
            <SvgText x="250" y="380"
                  fill="black"
                  fontFamily="Arial"
                  fontWeight="900"
                  fontSize="60"
                  textAnchor="middle">
              Web FM
            </SvgText>
          </Svg>
        </View>

        <Text style={styles.tagline}>
          Web FM: Webpage into Audiobook
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Roboto',
  },
});

export default SplashScreen;
import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Svg, Rect, Circle, G, Path, Text as SvgText } from 'react-native-svg';

const apiKey = 'AIzaSyAn27H6wswofcNJE68PTSTDq3tTJ3jCvPE';
const genAI = new GoogleGenerativeAI(apiKey);
const WORDS_PER_SECOND = 2.5;

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
      setTimeout(onFinish, 2000);
    });
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={[
        splashStyles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={splashStyles.logoContainer}>
          <Svg width={200} height={200} viewBox="0 0 500 500">
            <Rect x="0" y="0" width="500" height="500" fill="#000000" />
            <Circle cx="250" cy="250" r="220" fill="#1DB954" />
            <G transform="translate(0, -20)">
              <Rect x="150" y="185" width="200" height="160" rx="15" 
                    fill="none" stroke="black" strokeWidth="8"/>
              <Rect x="170" y="205" width="160" height="40" rx="5" 
                    fill="black"/>
              <SvgText x="250" y="233"
                    fontFamily="Segoe UI"
                    fontSize="26"
                    fontWeight="800"
                    letterSpacing="1"
                    textAnchor="middle"
                    fill="#1DB954">
                WEBSITE
              </SvgText>
              <Circle cx="195" cy="285" r="20" fill="black"/>
              <Circle cx="305" cy="285" r="20" fill="black"/>
              <Circle cx="195" cy="325" r="3" fill="black"/>
              <Circle cx="215" cy="325" r="3" fill="black"/>
              <Circle cx="235" cy="325" r="3" fill="black"/>
              <Circle cx="255" cy="325" r="3" fill="black"/>
              <Circle cx="275" cy="325" r="3" fill="black"/>
              <Circle cx="295" cy="325" r="3" fill="black"/>
              <Path d="M370 205 Q390 265 370 325" stroke="black" strokeWidth="6" fill="none"/>
              <Path d="M390 185 Q420 265 390 345" stroke="black" strokeWidth="6" fill="none"/>
            </G>
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
        <Text style={splashStyles.tagline}>
          Web FM: webpage into audiobook
        </Text>
      </Animated.View>
    </View>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedText, setScrapedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState([]);
  
  const soundRef = useRef(null);
  const scrollViewRef = useRef(null);
  const speechTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (speechTimerRef.current) {
        clearInterval(speechTimerRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      Speech.stop();
    };
  }, []);

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const fetchContent = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) {
        alert('Need audio permissions');
        return;
      }

      setIsLoading(true);
      const response = await axios.get(url, {
        responseType: 'text',
        headers: { 'Accept': 'text/plain' }
      });
      
      const content = response.data;
      const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' , systemInstruction:'Use the provided text content, which may range up to 6000 characters, to generate a concise summary. If the content is found to be minimal or lacking sufficient detail, automatically enrich it to ensure a comprehensive summary. Enrichment should add relevant information to flesh out the content before summarization. The final summary should capture the main points and essential details breifly , clearly and succinctly.'});
      const result = await model.generateContent(cleanContent.substring(0, 6000));
      const generatedText = result.response.text();
      
      const wordArray = generatedText.split(/\s+/);
      setWords(wordArray);
      setScrapedText(generatedText);
      setCurrentWordIndex(0);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.message || 'Failed to process URL'));
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToWord = (index) => {
    if (scrollViewRef.current && words[index]) {
      const approximatePosition = Math.floor(index / 8) * 30;
      scrollViewRef.current.scrollTo({
        y: approximatePosition,
        animated: true
      });
    }
  };

  const startWordHighlighting = (startIndex) => {
    if (speechTimerRef.current) {
      clearInterval(speechTimerRef.current);
    }

    setCurrentWordIndex(startIndex);
    scrollToWord(startIndex);

    speechTimerRef.current = setInterval(() => {
      setCurrentWordIndex(current => {
        const next = current + 1;
        if (next >= words.length) {
          clearInterval(speechTimerRef.current);
          return 0;
        }
        scrollToWord(next);
        return next;
      });
    }, 1000 / WORDS_PER_SECOND);
  };

  const speakFromIndex = async (startIndex) => {
    try {
      const textToSpeak = words.slice(startIndex).join(' ');
      setCurrentWordIndex(startIndex);
      setIsSpeaking(true);
      setIsPlaying(true);

      startWordHighlighting(startIndex);

      await Speech.speak(textToSpeak, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          setIsPlaying(false);
          setCurrentWordIndex(0);
          clearInterval(speechTimerRef.current);
        },
        onStopped: () => {
          setIsSpeaking(false);
          setIsPlaying(false);
          clearInterval(speechTimerRef.current);
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPlaying(false);
          clearInterval(speechTimerRef.current);
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      setIsPlaying(false);
      clearInterval(speechTimerRef.current);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (isSpeaking) {
        await Speech.stop();
        clearInterval(speechTimerRef.current);
        setIsSpeaking(false);
        setIsPlaying(false);
      } else {
        await speakFromIndex(currentWordIndex);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const skipBackward = async () => {
    try {
      setIsPlaying(false);
      await Speech.stop();
      clearInterval(speechTimerRef.current);
      const newIndex = Math.max(0, currentWordIndex - 25);
      setCurrentWordIndex(newIndex);
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const skipForward = async () => {
    try {
      setIsPlaying(false);
      await Speech.stop();
      clearInterval(speechTimerRef.current);
      const newIndex = Math.min(words.length - 1, currentWordIndex + 25);
      setCurrentWordIndex(newIndex);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.container}>
      {words.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter a URL"
              value={url}
              onChangeText={setUrl}
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={fetchContent}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading...' : 'Explore URL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.contentWrapper}>
            <ScrollView ref={scrollViewRef} style={styles.textContainer}>
              <View style={styles.wordsContainer}>
                {words.map((word, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.word,
                      index === currentWordIndex && styles.highlightedWord
                    ]}
                  >
                    {word}{' '}
                  </Text>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.playerContainer}>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipBackward}
                  //disabled={!isSpeaking}
                >
                  <MaterialIcons
                    name="replay-10"
                    size={30}
                    color={"#fff"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, isSpeaking && styles.playButtonActive]}
                  onPress={togglePlayPause}
                >
                  <MaterialIcons
                    name={isPlaying ? "pause" : "play-arrow"}
                    size={40}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipForward}
                  //disabled={!isSpeaking}
                >
                  <MaterialIcons
                    name="forward-10"
                    size={30}
                    color={"#fff"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const splashStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  inputContainer: {
    width: '80%',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
    width: '100%',
  },
  button: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#1DB95480',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#282828',
    borderRadius: 8,
    marginBottom: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
  },
  word: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  highlightedWord: {
    backgroundColor: '#1DB954',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  playerContainer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },skipButton: {
    backgroundColor: '#282828',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playButtonActive: {
    backgroundColor: '#168040',
  },
});

export default App;
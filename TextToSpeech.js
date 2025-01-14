import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const savesDirectory = FileSystem.documentDirectory + 'saves/';

// Ensure the `saves` directory exists
const ensureSavesDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(savesDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(savesDirectory, { intermediates: true });
  }
};

// Get the next available file name in the `saves` directory
const getNextFileName = async () => {
  const files = await FileSystem.readDirectoryAsync(savesDirectory);
  return `${files.length + 1}.mp3`;
};

// Main function to generate speech and save as an audio file
export const textToSpeech = async (text) => {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }

  try {
    // Ensure the `saves` directory exists
    await ensureSavesDirectory();

    // Get the next file name
    const fileName = await getNextFileName();
    const filePath = savesDirectory + fileName;

    // Start recording using Audio
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.mp3',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
      },
      ios: {
        extension: '.mp3',
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        linearPCMBitDepth: 16,
      },
    });

    // Start recording
    await recording.startAsync();

    // Generate speech with Expo Speech module
    Speech.speak(text, {
      onDone: async () => {
        // Stop recording after the speech is completed
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        // Move the recording file to the saves folder
        await FileSystem.moveAsync({
          from: uri,
          to: filePath,
        });

        console.log(`Audio file saved at: ${filePath}`);
        return filePath;
      },
    });
  } catch (error) {
    console.error('Error during text-to-speech:', error);
    throw error;
  }
};

// Function to play a saved audio file
export const playAudio = async (fileName) => {
  try {
    const sound = new Audio.Sound();
    const filePath = savesDirectory + fileName;
    await sound.loadAsync({ uri: filePath });
    await sound.playAsync();
    console.log(`Playing audio file: ${filePath}`);
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

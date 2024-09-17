import { StatusBar } from 'expo-status-bar';
import { Alert , Modal , View , Image , 
  TouchableOpacity , StyleSheet, Text, 
  SafeAreaView , ScrollView } from 'react-native';
import { useState } from 'react';
import * as imgPicker from 'expo-image-picker';
import * as Speech from 'expo-speech';

export default function App() {
  const [imagesData, setImagesData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [cameraPopUp, setCameraPopUp] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  function TextToSpeech(text) {
    const options = {
        language: 'th-TH',
        pitch: 1.0,
        rate: 1.0,
    };
  
    if (!speaking) {
        setSpeaking(true);
        Speech.speak(text, options);
    } else {
        setSpeaking(false);
        Speech.stop();
    }
  }

  const picImageGallery = async () => {
    await imgPicker.getMediaLibraryPermissionsAsync();
    let result = await imgPicker.launchImageLibraryAsync({
      mediaTypes: imgPicker.MediaTypeOptions.All,
      allowsEditing: false,
      base64: true,
      allowsMultipleSelection: true, 
    });

    if (!result.canceled) {
      const assets = result.assets;
      const imagesWithText = await fetchTextForImages(assets); 
      setImagesData([...imagesData, ...imagesWithText]); 
      setCurrentIndex(imagesData.length);
    }
  };

  const pickImageCamera = async () => {
    await imgPicker.getCameraPermissionsAsync();

    let result = await imgPicker.launchCameraAsync({
      mediaTypes: imgPicker.MediaTypeOptions.All,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      const newImage = result.assets[0];
      const text = await changeImgToText(newImage); 
      setImagesData([...imagesData, { uri: newImage.uri, text }]); 
      setCurrentIndex(imagesData.length); 
    }
  };

  const changeImgToText = async (image) => {
    let header = new Headers();
    header.append("apikey", "7X32EtYkqcEX4wySoT90eI4zCbodrh2O");
    header.append("Content-Type", "multipart/form-data");

    let requestOption = {
      method: 'POST',
      redirect: 'follow',
      headers: header,
      body: image,
    };

    return await fetch("https://api.apilayer.com/image_to_text/upload", requestOption)
      .then(response => response.json())
      .then(result => result["all_text"])
      .catch(error => {
        console.error('Error:', error);
        return '';
      });
  };

  
  const fetchTextForImages = async (images) => {
    const imageWithTextPromises = images.map(async (image) => {
      const text = await changeImgToText(image);
      return { uri: image.uri, text };
    });
    
    return await Promise.all(imageWithTextPromises);
  };

  const handleNext = () => {
    if (currentIndex < imagesData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {imagesData.length > 0 ? (
        <Image source={{ uri: imagesData[currentIndex].uri }} style={styles.image} />
      ) : null}

      <Modal
        animationType="slide"
        transparent={true}
        visible={cameraPopUp}
        onRequestClose={() => {
          setCameraPopUp(false);
        }}>
        <View style={styles.modalcenteredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.modalbutton} 
              onPress={() => {
                pickImageCamera();
                setCameraPopUp(false);
              }}>
              <Text>From Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalbutton} 
              onPress={() => {
                picImageGallery();
                setCameraPopUp(false);
              }}>
              <Text>From Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <Text style={{ fontSize: 15 }}>{imagesData[currentIndex]?.text}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.button} 
          onPress={() => { imagesData[currentIndex]?.text ? TextToSpeech(imagesData[currentIndex].text) : setCameraPopUp(true) }}>
          {imagesData[currentIndex]?.text ?(
            speaking ? (
                  <Text style={styles.buttonText}>Press to Stop</Text>
                ) : (
                  <Text style={styles.buttonText}>Press to Listen</Text>
              )) : (<Text style={styles.buttonText}>Press to Select Image</Text>)}
          {imagesData.length > 1? (<Text style={styles.buttonText}>Page {currentIndex+1} / {imagesData.length}</Text>):null}
      </TouchableOpacity>

      {imagesData.length > 1 ? (
        <View style={styles.buttonContainerRow}>
          <TouchableOpacity style={styles.button} onPress={handlePrevious} disabled={currentIndex === 0}>
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={styles.button}
          onPress={() => setCameraPopUp(true)}>
          <Text style={styles.buttonText}>Select New Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleNext} disabled={currentIndex === imagesData.length - 1}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: "#dba88c",
    fontStyle: 'bold'
  },
  container: {
    flex: 1,
    backgroundColor: '#d99679',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#a15a3b',
    padding: 15,
    borderRadius: 20,
    margin: 10,
    textAlign:'center'
    // marginHorizontal:50,
  },
  buttonContainerRow:{
    flexDirection: 'row', 
    justifyContent: 'center',
    marginBottom: 20
  },
  modalbutton: {
    backgroundColor: '#edc8b9',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    objectFit: "contain",
    marginTop: 50
  },
  scrollView: {
    backgroundColor: '#e3bda1',
    margin: 15,
    borderRadius: 10,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
  },
  modalcenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#edc8b9',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
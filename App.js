import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';
import io from 'socket.io-client';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [imageStocke, setImageStocke] = useState(null);
  const imageRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const initCamera = async () => {
    if (hasPermission) {
      const { uri, width, height } = await imageRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      setImageStocke(uri);
      setIsStreaming(true);
      startStreaming();
    } else {
      console.log('Permission de la caméra refusée!');
    }
  };

  const startStreaming = () => {
    if (camera && isStreaming) {
      camera.resumePreview();
      captureImageAndStore();
    }
  };

  const captureImageAndStore = async () => {
    try {
      const { uri } = await imageRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      setImageStocke(uri);
    } catch (error) {
      console.log('Erreur lors de la capture de l\'image :', error);
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (camera) {
      camera.pausePreview();
    }
  };

  useEffect(() => {
    socketRef.current = io('http://192.168.43.4:3000', { transports: ['websocket'] });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', 'cible_room');
    });
  }, []);

  useEffect(() => {
    if (hasPermission) {
      initCamera();
    }
  }, [hasPermission]);

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        captureImageAndStore();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  return (
    <View style={styles.container}>
      <View>
      {imageStocke && <Image source={{ uri: imageStocke }} style={styles.image} />}

      </View>
      <Text>Bienvenue dans l'application Caméra !</Text>
      {/* <TouchableOpacity onPress={() => setIsStreaming(!isStreaming)}>
        <Text>{isStreaming ? 'Arrêter le streaming' : 'Démarrer le streaming'}</Text>
      </TouchableOpacity> */}
      <Camera style={styles.camera} type={Camera.Constants.Type.back} ref={imageRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: 200,
    height: 200,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
  },
});

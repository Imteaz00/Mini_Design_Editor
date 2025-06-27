import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Button, Image, TextInput, Text as RNText, Alert, TouchableOpacity } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";

// === Draggable & Editable Text ===
function DraggableText({ id, label, onChangeText, onUpdatePosition, onSelect, initialX = 0, initialY = 0 }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(label);
    const inputRef = useRef(null);

    const offsetX = useSharedValue(initialX);
    const offsetY = useSharedValue(initialY);

    const panGesture = Gesture.Pan().onUpdate((e) => {
        offsetX.value = e.translationX + initialX;
        offsetY.value = e.translationY + initialY;
    })
        .onEnd(() => {
            runOnJS(onUpdatePosition)(id, offsetX.value, offsetY.value);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
    }));

    useEffect(() => {
        if (isEditing && inputRef.current) inputRef.current.focus();
    }, [isEditing]);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.draggableText, animatedStyle]}>
            {isEditing ? (
                    <TextInput ref={inputRef} value={text} onChangeText={setText} onBlur={() => {setIsEditing(false);onChangeText(id, text);}} style={styles.textInput}/>
                ) : (
                    <TouchableOpacity onPress={() => { setIsEditing(true);onSelect?.(id);}}>
                    <RNText>{text}</RNText>
                    </TouchableOpacity>
                )
            }
            </Animated.View>
            </GestureDetector>
    );
}

//Draggable Shape
function DraggableShape({ id, style, onUpdateTransform, onSelect, initialX = 0, initialY = 0, initialScale = 1 }) {
    const offsetX = useSharedValue(initialX);
    const offsetY = useSharedValue(initialY);
    const scale = useSharedValue(initialScale);

    const panGesture = Gesture.Pan().onUpdate((e) => {
        offsetX.value = e.translationX + initialX;
        offsetY.value = e.translationY + initialY;
    }).onEnd(() => {
        runOnJS(onUpdateTransform)(id, offsetX.value, offsetY.value, scale.value);
    });

    const pinchGesture = Gesture.Pinch().onUpdate((e) => {
        scale.value = e.scale * initialScale;
    }).onEnd(() => {
        runOnJS(onUpdateTransform)(id, offsetX.value, offsetY.value, scale.value);
    });

    const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: offsetX.value },
            { translateY: offsetY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <TouchableOpacity onPress={() => onSelect?.(id)} style={{ position: "absolute" }}>
                <Animated.View style={[
                    styles.baseShape,
                    style === "rectangle" ? styles.rectangle : styles.circle,
                    animatedStyle,
                ]}
                />
            </TouchableOpacity>
        </GestureDetector>
    );
}

//Draggable Image
function DraggableImage({ id, uri, onUpdateTransform, onSelect, initialX = 0, initialY = 0, initialScale = 1 }) {
    const offsetX = useSharedValue(initialX);
    const offsetY = useSharedValue(initialY);
    const scale = useSharedValue(initialScale);

    const panGesture = Gesture.Pan().onUpdate((e) => {
        offsetX.value = e.translationX + initialX;
        offsetY.value = e.translationY + initialY;
    }).onEnd(() => {
        runOnJS(onUpdateTransform)(id, offsetX.value, offsetY.value, scale.value);
    });

    const pinchGesture = Gesture.Pinch().onUpdate((e) => {
        scale.value = e.scale * initialScale;
    }).onEnd(() => {
        runOnJS(onUpdateTransform)(id, offsetX.value, offsetY.value, scale.value);
    });

    const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <TouchableOpacity onPress={() => onSelect?.(id)} style={{ position: "absolute" }}>
                <Animated.View style={[styles.mediaContainer, animatedStyle]}>
                    <Image source={{ uri }} style={styles.media} resizeMode="contain" />
                </Animated.View>
            </TouchableOpacity>
        </GestureDetector>
    );
}

//Main
export default function Index() {
    const [texts, setTexts] = useState([]);
    const [rectangles, setRectangles] = useState([]);
    const [circles, setCircles] = useState([]);
    const [images, setImages] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const viewShotRef = useRef(null);

    const addText = () =>
        setTexts((prev) => [...prev, { id: Date.now(), label: "New Text", x: 0, y: 0 }]);

    const addRectangle = () =>
        setRectangles((prev) => [...prev, { id: Date.now(), x: 0, y: 0, scale: 1 }]);

    const addCircle = () =>
        setCircles((prev) => [...prev, { id: Date.now(), x: 0, y: 0, scale: 1 }]);

    const addImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Cannot access gallery.");
            return;
        }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
    });

        if (!result.canceled && result.assets?.length > 0) {
            const image = result.assets[0];
            setImages((prev) => [
                ...prev,
                { id: Date.now(), uri: image.uri, x: 0, y: 0, scale: 1 },
            ]);
        }
    };

    const updateText = (id, newText) =>
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, label: newText } : t)));

    const updateTextPosition = (id, x, y) =>
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));

    const updateRectangleTransform = (id, x, y, scale) =>
        setRectangles((prev) => prev.map((r) => (r.id === id ? { ...r, x, y, scale } : r)));

    const updateCircleTransform = (id, x, y, scale) =>
        setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, x, y, scale } : c)));

    const updateImageTransform = (id, x, y, scale) =>
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, x, y, scale } : img)));

    const removeSelected = () => {
        setTexts((prev) => prev.filter((t) => t.id !== selectedId));
        setRectangles((prev) => prev.filter((r) => r.id !== selectedId));
        setCircles((prev) => prev.filter((c) => c.id !== selectedId));
        setImages((prev) => prev.filter((img) => img.id !== selectedId));
        setSelectedId(null);
    };

    const exportDesign = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission required", "Cannot save image.");
                return;
            }
            const uri = await viewShotRef.current.capture();
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync("DesignExports", asset, false);
            Alert.alert("Saved!", "Canvas image saved to gallery.");
        } catch {
            Alert.alert("Error", "Could not save image.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.buttonRow}>
                <Button title="Add Text" onPress={addText} />
                <Button title="Add Rect" onPress={addRectangle} />
                <Button title="Add Circle" onPress={addCircle} />
                <Button title="Add Image" onPress={addImage} />
            </View>

            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }} style={{ flex: 1 }}>
                <View style={styles.canvas}> 
                    {texts.map((t) => (
                        <DraggableText key={t.id} id={t.id} label={t.label} initialX={t.x} initialY={t.y} onChangeText={updateText} onUpdatePosition={updateTextPosition} onSelect={setSelectedId}/>
                    ))}

                    {rectangles.map((r) => (
                        <DraggableShape key={r.id} id={r.id} style="rectangle" initialX={r.x} initialY={r.y} initialScale={r.scale} onUpdateTransform={updateRectangleTransform} onSelect={setSelectedId}/>
                    ))}

                    {circles.map((c) => (
                        <DraggableShape key={c.id} id={c.id} style="circle" initialX={c.x} initialY={c.y} initialScale={c.scale} onUpdateTransform={updateCircleTransform} onSelect={setSelectedId}/>
                    ))}

                    {images.map((img) => (
                        <DraggableImage key={img.id} id={img.id} uri={img.uri} initialX={img.x} initialY={img.y} initialScale={img.scale} onUpdateTransform={updateImageTransform} onSelect={setSelectedId}/>
                    ))}
                </View>
            </ViewShot>

            <View style={styles.buttonRow}>
                <Button title="Export" onPress={exportDesign} color="#007AFF" />
            </View>

            <View style={styles.buttonRow}>
                {selectedId && (<Button title="Remove" onPress={removeSelected} color="red" />)}
            </View>
            <View style={styles.buttonRow}></View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  canvas: { flex: 1, backgroundColor: "#fff" },
  draggableText: {
    position: "absolute",
    padding: 4,
    backgroundColor: "#ffffffcc",
    borderWidth: 1,
    borderColor: "#000",
  },
  textInput: {
    fontSize: 16,
    padding: 4,
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
  },
  baseShape: {
    position: "absolute",
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "transparent",
  },
  rectangle: { borderRadius: 0 },
  circle: { borderRadius: 50 },
  mediaContainer: {
    position: "absolute",
    width: 120,
    height: 120,
  },
  media: { width: "100%", height: "100%" },
});

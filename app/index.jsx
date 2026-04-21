import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";

// IMPORTAMOS LAS FUNCIONES DESDE TU ARCHIVO CONTEXT
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // BLOQUEO FÍSICO DEL BOTÓN ATRÁS EN ANDROID
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const handleAuthentication = async () => {
    if (isLogin && (email === "" || password === "")) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }
    if (!isLogin && (name === "" || email === "" || password === "")) {
      Alert.alert(
        "Error",
        "Por favor llena todos los campos, incluido tu nombre",
      );
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
        Alert.alert("Éxito", `Cuenta creada correctamente para ${name}`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Credenciales incorrectas o problema de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Image
          source={require("../assets/images/otiLogo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>GESTIÓN DE NEGOCIO</Text>
      </View>

      <View style={styles.formContainer}>
        {!isLogin && (
          <View style={styles.inputContainer}>
            <Text style={styles.iconPlaceholder}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#999"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={24} color={COLORS.gray} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="remove-circle" size={24} color={COLORS.gray} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAuthentication}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "INICIAR SESIÓN →" : "REGISTRARSE →"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.footerContainer}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.footerText}>
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Text style={styles.footerTextBold}>
            {isLogin ? "Regístrate" : "Inicia Sesión"}
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ESTILOS SE QUEDAN IGUAL
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3E2723",
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  logo: { width: 350, height: 350, marginBottom: -100, marginTop: -50 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  formContainer: { width: "100%" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  iconPlaceholder: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#212121" },
  primaryButton: {
    backgroundColor: "#D84315",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footerContainer: { marginTop: 40, alignItems: "center" },
  footerText: { color: "#FFF8E1", fontSize: 14 },
  footerTextBold: { fontWeight: "bold", color: "#FFFFFF" },
});

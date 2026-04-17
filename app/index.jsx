import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Importamos updateProfile para poder guardar el nombre
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Importamos nuestros colores
import { COLORS } from "../constants/theme";

export default function LoginScreen() {
  const [name, setName] = useState(""); // <-- Nuevo estado para el nombre
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuthentication = async () => {
    // Validación para el login
    if (isLogin && (email === "" || password === "")) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }
    // Validación extra para el registro
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
        // Lógica de Inicio de Sesión
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/(tabs)");
      } else {
        // Lógica de Registro
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // <-- Guardamos el nombre en el perfil del usuario de Firebase
        await updateProfile(userCredential.user, {
          displayName: name,
        });

        Alert.alert("Éxito", `Cuenta creada correctamente para ${name}`);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.log(error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        Alert.alert("Error", "Correo o contraseña incorrectos");
      } else if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "Este correo ya está registrado");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      } else {
        Alert.alert("Error", "Ocurrió un problema, intenta de nuevo");
      }
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
        {/* <-- CAMPO DE NOMBRE: Solo se muestra si NO estamos en Login (isLogin === false) --> */}
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
          <Text style={styles.iconPlaceholder}>✉️</Text>
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
          <Text style={styles.iconPlaceholder}>🔒</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3E2723",
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 350,
    height: 350,
    marginBottom: -100,
    marginTop: -50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  iconPlaceholder: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
  },
  primaryButton: {
    backgroundColor: "#D84315",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footerContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "#FFF8E1",
    fontSize: 14,
  },
  footerTextBold: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

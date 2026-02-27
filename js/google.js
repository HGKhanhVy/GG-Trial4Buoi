import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq9JHvSmo66qow3AS-apdb5iaeRM0hpsg",
  authDomain: "phieutrial.firebaseapp.com",
  projectId: "phieutrial",
  storageBucket: "phieutrial.firebasestorage.app",
  messagingSenderId: "644397284177",
  appId: "1:644397284177:web:f3c0ea71e495672c5d7170",
  measurementId: "G-G69E1QY2V6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
const btnGoogle = document.getElementById("btnGoogleLogin");

btnGoogle.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;
    const teacherId = user.uid;

    await setDoc(
      doc(db, "teachers", teacherId),
      {
        email: user.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("Đăng nhập thất bại. Vui lòng thử lại!");
  }
});
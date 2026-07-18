// src/firebase/auth.js - ORIGINAL VERSION (Without Cloud Functions)

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import {
  addDocument,
  getDocument,
  COLLECTIONS,
  getCollection,
  setDocument,
} from "./firestore";

// Login with email OR username
export const loginWithEmail = async (emailOrUsername, password) => {
  let email = emailOrUsername;

  if (!emailOrUsername.includes("@")) {
    const users = await getCollection(COLLECTIONS.USERS, [
      { field: "fullName", operator: "==", value: emailOrUsername },
    ]);

    if (users && users.length > 0) {
      email = users[0].email;
    } else {
      throw new Error("User not found with this username");
    }
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
};

// Register with email
export const registerWithEmail = async (
  email,
  password,
  displayName,
  phone = "",
  role = "Owner",
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await updateProfile(userCredential.user, { displayName });

    const userData = {
      userId: userCredential.user.uid,
      fullName: displayName,
      email: email,
      phone: phone,
      role: role,
      status: "Active",
      picture: null,
      createdBy: null,
      farmId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDocument(COLLECTIONS.USERS, userCredential.user.uid, userData);
    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// ✅ CREATE USER WITHOUT LOGIN (Original working version)
export const createUserWithoutLogin = async (
  email,
  password,
  displayName,
  phone = "",
  role = "Worker",
  farmId = null,
  createdBy = null,
) => {
  try {
    console.log("1. Creating user with email:", email);

    // Store current user email before creating new user
    const ownerEmail = auth.currentUser?.email;

    if (!ownerEmail) {
      throw new Error("No owner logged in");
    }

    // Create the new user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log("2. User created successfully:", userCredential.user.uid);

    // Update profile
    await updateProfile(userCredential.user, { displayName });
    console.log("3. Profile updated");

    // Create user document
    const userData = {
      userId: userCredential.user.uid,
      fullName: displayName,
      email: email,
      phone: phone,
      role: role,
      status: "Active",
      picture: null,
      createdBy: createdBy,
      farmId: farmId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDocument(COLLECTIONS.USERS, userCredential.user.uid, userData);
    console.log("4. User document created");

    // ✅ Sign out the new user
    await signOut(auth);
    console.log("5. New user signed out");

    // Return user info
    return {
      uid: userCredential.user.uid,
      email: email,
      fullName: displayName,
      phone: phone,
      role: role,
      password: password,
      farmId: farmId,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// Reset Password
export const resetPassword = async (email) => {
  const actionCodeSettings = {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
};

// Google Login
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userDoc = await getDocument(COLLECTIONS.USERS, user.uid);
  if (!userDoc) {
    await addDocument(COLLECTIONS.USERS, {
      userId: user.uid,
      fullName: user.displayName || user.email,
      email: user.email,
      phone: "",
      role: "User",
      status: "Active",
      picture: user.photoURL || null,
    });
  }
  return user;
};

// Auth State Listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDocument(COLLECTIONS.USERS, user.uid);
        callback({
          uid: user.uid,
          email: user.email,
          fullName: userDoc?.fullName || user.displayName || user.email,
          picture: userDoc?.picture || user.photoURL || null,
          ...userDoc,
        });
      } catch (error) {
        console.error("Error fetching user doc:", error);
        callback({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || user.email,
          picture: user.photoURL || null,
        });
      }
    } else {
      callback(null);
    }
  });
};

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8kf6svLvqk21_fsQ5zWHFcvdm4YhXqbU",
  authDomain: "bxdx-5dd53.firebaseapp.com",
  databaseURL: "https://bxdx-5dd53-default-rtdb.firebaseio.com",
  projectId: "bxdx-5dd53",
  storageBucket: "bxdx-5dd53.appspot.com",
  messagingSenderId: "88356629254",
  appId: "1:88356629254:web:608d9ac86c4483056dcc87",
  measurementId: "G-ZCR6KD7EVY",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storedb = getFirestore(app);

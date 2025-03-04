import { db } from "./firebaseConfig";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

// ✅ スコアを追加する関数（既存）
export const addScore = async (gameId, inning, team, runs, event) => {
  try {
    const docRef = await addDoc(collection(db, `games/${gameId}/scores`), {
      gameId,
      inning,
      team,
      runs,
      event,
      timestamp: new Date()
    });
    console.log("✅ スコアが追加されました！", docRef.id);
  } catch (error) {
    console.error("❌ スコアの追加に失敗しました:", error);
  }
};

// ✅ 指定した試合のスコアを取得する関数（既存）
export const getScores = async (gameId) => {
  try {
    const q = query(collection(db, `games/${gameId}/scores`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ スコアの取得に失敗しました:", error);
    return [];
  }
};

// ✅ スコアを編集する関数（新規追加）
export const updateScore = async (gameId, scoreId, updatedData) => {
  try {
    const scoreRef = doc(db, `games/${gameId}/scores`, scoreId);
    await updateDoc(scoreRef, updatedData);
    console.log("✅ スコアが更新されました！", scoreId);
  } catch (error) {
    console.error("❌ スコアの更新に失敗しました:", error);
  }
};

// ✅ スコアを削除する関数（新規追加）
export const deleteScore = async (gameId, scoreId) => {
  try {
    const scoreRef = doc(db, `games/${gameId}/scores`, scoreId);
    await deleteDoc(scoreRef);
    console.log("✅ スコアが削除されました！", scoreId);
  } catch (error) {
    console.error("❌ スコアの削除に失敗しました:", error);
  }
};

// ✅ 試合データを更新する関数
export const updateGame = async (gameId, updatedData) => {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, updatedData);
    console.log("✅ 試合データが更新されました！", gameId);
  } catch (error) {
    console.error("❌ 試合データの更新に失敗しました:", error);
  }
};

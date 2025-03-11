"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

export default function GameDetails() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [inning, setInning] = useState(1);
  const [inningType, setInningType] = useState("表"); // "表" or "裏"
  const [team, setTeam] = useState("");
  const [runs, setRuns] = useState(0);
  const [scoreData, setScoreData] = useState([]);

  // ✅ スコアデータを集計する関数
const processScoreData = (scores) => {
  const groupedScores = {};

  scores.forEach((score) => {
    const key = `${score.inning}-${score.half}`; // イニングと表/裏をキーにする
    if (!groupedScores[key]) {
      groupedScores[key] = {
        id: score.id,
        inning: score.inning,
        half: score.half,
        team: score.team,
        runs: score.runs, // 初回スコア
      };
    } else {
      groupedScores[key].runs += score.runs; // 同じイニングなら得点を加算
    }
  });

  return Object.values(groupedScores).sort((a, b) => {
    if (a.inning === b.inning) {
      return a.inning - b.inning; // イニング順にソート
    }
    return a.half === "表" ? -1 : 1; // 表を先に表示
  });
};

// ✅ useEffect の中でスコアデータを加工
useEffect(() => {
  if (!id) return;

  const scoresRef = collection(db, "games", id, "scores");

  const unsubscribe = onSnapshot(scoresRef, (querySnapshot) => {
    const rawScores = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const processedScores = processScoreData(rawScores); // データ整理を適用
    setScoreData(processedScores);
  });

  return () => unsubscribe();
}, [id]);

  // ✅ Firestore から試合データを取得
  useEffect(() => {
    console.log("取得する試合ID:", id);
    const fetchGame = async () => {
      if (!id) return;
      const docRef = doc(db, "games", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("試合データ:", docSnap.data()); // デバッグ用
        setGame(docSnap.data());
      } else {
        console.error("試合が見つかりませんでした。");
      }
    };

    const fetchScores = async () => {
      if (!id) return;
      const scoresRef = collection(db, "games", id, "scores");

      const unsubscribe = onSnapshot(scoresRef, (querySnapshot) => {
        const scoreList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScoreData(scoreList);
      });

      return () => unsubscribe();
    };

    fetchGame();
    fetchScores();
  }, [id]);

  // ✅ スコアの追加処理
  const addScore = async () => {
    if (!team || runs < 0) {
      alert("正しいスコアを入力してください");
      return;
    }

    const scoresRef = collection(db, "games", id, "scores");
    await addDoc(scoresRef, {
      inning,
      half: inningType,// ✅ 表/裏を Firestore に保存する
      team,
      runs,
      createdAt: serverTimestamp(),
    });

    setInning(1);
    setInningType("表");
    setTeam("");
    setRuns(0);
  };

  if (!game) {
    return <p className="text-center mt-10">試合データを読み込み中...</p>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-white">
        {game.team_home} vs {game.team_away} - 試合詳細
      </h1>

      {/* ✅ スコア追加フォーム */}
      <div className="mt-6 bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-white">スコアを追加</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* ✅ イニング */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">イニング</label>
            <input
              type="number"
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600"
              value={inning}
              onChange={(e) => setInning(Number(e.target.value))}
            />
          </div>

          {/* ✅ 表 or 裏 */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">表 or 裏</label>
            <select
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600"
              value={inningType}
              onChange={(e) => setInningType(e.target.value)}
            >
              <option value="表">表</option>
              <option value="裏">裏</option>
            </select>
          </div>

          {/* ✅ チーム */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">チーム</label>
            <select
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">選択</option>
              <option value={game.team_home}>{game.team_home}</option>
              <option value={game.team_away}>{game.team_away}</option>
            </select>
          </div>

          {/* ✅ 点数 */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">得点</label>
            <input
              type="number"
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600"
              value={runs}
              onChange={(e) => setRuns(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          onClick={addScore}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full"
        >
          追加
        </button>
      </div>

      {/* ✅ スコア一覧 */}
      <h2 className="text-xl font-bold mt-6 text-white">スコア一覧</h2>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-gray-900 border border-gray-700 rounded-lg shadow-md">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-2 px-4 border border-gray-700">イニング</th>
              <th className="py-2 px-4 border border-gray-700">表/裏</th>
              <th className="py-2 px-4 border border-gray-700">チーム</th>
              <th className="py-2 px-4 border border-gray-700">得点</th>
            </tr>
          </thead>
          <tbody>
            {scoreData.map((score) => (
              <tr key={`${score.id}`} className="text-center hover:bg-gray-700">
                <td className="py-2 px-4 border border-gray-700 text-white">{score.inning}</td>
                <td className="py-2 px-4 border border-gray-700 text-white">{score.half}</td>
                <td className="py-2 px-4 border border-gray-700 text-white">{score.team}</td>
                <td className="py-2 px-4 border border-gray-700 text-white">{score.runs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => window.history.back()}
        className="mt-6 bg-gray-500 text-white px-4 py-2 rounded block mx-auto"
      >
        戻る
      </button>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { updateGame } from "../../../firestoreUtils";

// ✅ 追加: Recharts をインポート（得点推移グラフ用）
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [isEditing, setIsEditing] = useState(false);
  const [scoreData, setScoreData] = useState([]); // ✅ 得点推移グラフ用データ
  const [team_home, setteam_home] = useState("");
  const [team_away, setteam_away] = useState("");
  const [inning, setInning] = useState("");
  const [team, setTeam] = useState("");
  const [runs, setRuns] = useState(0);
  const [event, setEvent] = useState("");

  // ✅ Firestore から試合データを取得
  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;
      const docRef = doc(db, "games", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const gameData = docSnap.data();
        setGame(gameData);
        setLocation(gameData.location);
        setDate(new Date(gameData.date.seconds * 1000).toISOString().slice(0, 16));
        setStatus(gameData.status);
        setteam_home(gameData.team_home);  // 追加
        setteam_away(gameData.team_away);  // 追加
      } else {
        console.error("試合が見つかりませんでした。");
      }
    };

    fetchGame();
  }, [id]);

  // ✅ Firestore からスコアデータをリアルタイムで取得
  useEffect(() => {
    if (!id) return;

    const scoresRef = collection(db, "games", id, "scores");

    const unsubscribe = onSnapshot(scoresRef, (querySnapshot) => {
      let inningScores = {};

      querySnapshot.forEach((doc) => {
        const score = doc.data();
        if (!inningScores[score.inning]) {
          inningScores[score.inning] = { inning: score.inning, [score.team]: score.runs };
        } else {
          inningScores[score.inning][score.team] =
            (inningScores[score.inning][score.team] || 0) + score.runs;
        }
      });

      setScoreData(Object.values(inningScores).sort((a, b) => a.inning - b.inning));
    });

    return () => unsubscribe();
  }, [id]);

  // ✅ 試合情報の更新処理
    const handleUpdateGame = async () => {
      await updateGame(id, {
        team_home,
        team_away,
        location,
        date: new Date(date),
        status
      });
      setIsEditing(false);
    };
  

  // ✅ スコアの追加処理
  const addScore = async () => {
    if (!inning || !team || runs < 0) {
      alert("正しいスコアを入力してください");
      return;
    }

    const scoresRef = collection(db, "games", id, "scores");
    await addDoc(scoresRef, {
      inning: parseInt(inning),
      team,
      runs: parseInt(runs),
      event,
      createdAt: serverTimestamp(),
    });

    setInning("");
    setTeam("");
    setRuns(0);
    setEvent("");
  };

  if (!game) {
    return <p className="text-center mt-10">試合データを読み込み中...</p>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-white">
        {team_home} vs {team_away}
      </h1>

      {!isEditing ? (
        <>
          <p className="text-center text-gray-400">場所: {game.location}</p>
          <p className="text-center text-gray-400">
            日付: {new Date(game.date.seconds * 1000).toLocaleString()}
          </p>
          <p className="text-center text-gray-400">ステータス: {game.status}</p>

          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded mt-4 w-full"
          >
            試合情報を編集            
          </button>
        </>
      ) : (
        <div className="mt-6 bg-gray-900 p-6 rounded-lg shadow-md">
          {/* ✅ 試合情報を編集 */}
          <h2 className="text-xl font-bold mb-4 text-white">試合情報を編集</h2>

          {/* ✅ ホームチーム編集 */}
          <label className="block text-gray-400 text-sm mb-1">ホームチーム名</label>
          <input
            type="text"
            className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600 mb-4"
            value={team_home}
            onChange={(e) => setteam_home(e.target.value)}
          />

          {/* ✅ アウェイチーム編集 */}
          <label className="block text-gray-400 text-sm mb-1">アウェイチーム名</label>
          <input
            type="text"
            className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600 mb-4"
            value={team_away}
            onChange={(e) => setteam_away(e.target.value)}
          />
          {/* ✅ 試合会場 */}
          <label className="block text-gray-400 text-sm mb-1">試合会場</label>
          <input
            type="text"
            className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600 mb-4"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />


            {/* ✅ 試合日程 */}
            <label className="block text-gray-400 text-sm mb-1">試合日程</label>
            <input
              type="datetime-local"
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600 mb-4"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* ✅ ステータス */}
            <label className="block text-gray-400 text-sm mb-1">ステータス</label>
            <select
              className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600 mb-4"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ongoing">進行中</option>
              <option value="finished">終了</option>
            </select>

            {/* ✅ 更新ボタン */}
            <button
              onClick={handleUpdateGame}
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
            >
              更新
            </button>

            {/* ✅ キャンセルボタン */}
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded w-full mt-2"
            >
              キャンセル
            </button>
          </div>
      )}

        <div>
          {/* ✅ 「試合情報の編集」の下に「試合の詳細」ボタンを追加 */}
          <button
            onClick={() => window.location.href = `/games/${id}/details`}

            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full"
          >
            試合の詳細
          </button>
          </div>

      {/* ✅ 得点推移グラフ */}
      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-white">得点推移</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="inning" tick={{ fill: "white" }} />
            <YAxis tick={{ fill: "white" }} />
            <Tooltip />
            <Legend />
            {team_home && <Line type="monotone" dataKey={team_home} stroke="#8884d8" />}
            {team_away && <Line type="monotone" dataKey={team_away} stroke="#82ca9d" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button
        onClick={() => window.history.back()}
        className="mt-6 bg-gray-500 text-white px-4 py-2 rounded block mx-auto"
        >
      試合一覧へ戻る
      </button>
    </div>
  );
}

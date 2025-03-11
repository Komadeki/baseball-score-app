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
  const [firstAttack, setFirstAttack] = useState("");
  const [lastAttack, setLastAttack] = useState("");

  const processScoreData = (scores, firstAttack, lastAttack) => {
    const groupedScores = {};
  
    scores.forEach((score) => {
      const key = `${score.inning}-${score.half}`;
      const teamName = score.half === "表" ? firstAttack : lastAttack; // 先攻・後攻を参照
  
      if (!groupedScores[key]) {
        groupedScores[key] = {
          id: score.id,
          inning: score.inning,
          half: score.half,
          team: teamName, // 自動的にチーム名を設定
          runs: score.runs,
        };
      } else {
        groupedScores[key].runs += score.runs; // 同じイニングなら得点を加算
      }
    });
  
    const sortedData = Object.values(groupedScores).sort((a, b) => {
      if (a.inning !== b.inning) return a.inning - b.inning;
      return a.half === "表" ? -1 : 1;
    });
  
    console.log("ソート後のデータ:", JSON.stringify(sortedData, null, 2)); // 🔍 デバッグ用
  
    return sortedData;
  };
  
  

// ✅ 試合データ（チーム名、先攻・後攻）をリアルタイム取得
useEffect(() => {
  if (!id) return;

  const docRef = doc(db, "games", id);

  // ✅ Firestore の onSnapshot を使用してリアルタイム更新
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const gameData = docSnap.data();
      setGame(gameData);
      setFirstAttack(gameData.firstAttack || ""); // 先攻チーム
      setLastAttack(gameData.lastAttack || "");  // 後攻チーム
    } else {
      console.error("試合が見つかりませんでした。");
    }
  });

  return () => unsubscribe();
}, [id]); // ✅ id の変更時に実行

// ✅ useEffect の中でスコアデータを加工
useEffect(() => {
  if (!id || !firstAttack || !lastAttack) return;

  const scoresRef = collection(db, "games", id, "scores");

  const unsubscribe = onSnapshot(scoresRef, (querySnapshot) => {
    const rawScores = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("ソート前のデータ:", JSON.stringify(rawScores, null, 2));

    const processedScores = processScoreData(rawScores, firstAttack, lastAttack); // チーム情報を適用
    console.log("ソート後のデータ:", JSON.stringify(processedScores, null, 2));

    setScoreData(processedScores); // ✅ ソート後のデータを画面に適用
  });

  return () => unsubscribe();
}, [id, firstAttack, lastAttack]); // ✅ firstAttack, lastAttack を依存関係に追加


  // ✅ Firestore から試合データを取得
  useEffect(() => {
    if (!id) return;
  
    const fetchGame = async () => {
      const docRef = doc(db, "games", id);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const gameData = docSnap.data();
        setGame(gameData);
        setFirstAttack(gameData.firstAttack || "");  // ✅ 追加
        setLastAttack(gameData.lastAttack || "");    // ✅ 追加
      } else {
        console.error("試合が見つかりませんでした。");
      }
    };
  
    fetchGame();
  }, [id]);
  


  // ✅ スコアの追加処理
  const addScore = async () => {
    if (!team || runs < 0) {
      alert("正しいスコアを入力してください");
      return;
    }
  
    // ✅ チームによって自動で「表 or 裏」を決定
    const inningType = team === firstAttack ? "表" : "裏";
  
    const scoresRef = collection(db, "games", id, "scores");
    await addDoc(scoresRef, {
      inning,
      half: inningType, // ✅ 自動設定
      team,
      runs,
      createdAt: serverTimestamp(),
    });
  
    setInning(1);
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

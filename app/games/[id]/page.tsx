"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { addScore, getScores, updateScore, deleteScore } from "../../../firestoreUtils";

export default function GameDetail() {
  const router = useRouter(); // ✅ 一覧に戻るためのルーター
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState([]);
  const [inning, setInning] = useState(1);
  const [inningHalf, setInningHalf] = useState("表"); // ✅ イニングの表裏
  const [team, setTeam] = useState("");
  const [runs, setRuns] = useState(0);
  const [eventType, setEventType] = useState(""); // ✅ イベントの第1階層（バッティング / それ以外）
  const [eventDetail, setEventDetail] = useState(""); // ✅ 詳細イベント（バッティングを選択時）
  const [editingScore, setEditingScore] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;
      const docRef = doc(db, "games", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setGame(docSnap.data());
      } else {
        console.error("試合が見つかりませんでした。");
      }
    };

    const fetchScores = async () => {
      const scoreList = await getScores(id);
      setScores(scoreList);
    };

    fetchGame();
    fetchScores();
  }, [id]);

  const handleAddScore = async () => {
    const finalEvent = eventType === "バッティング" ? eventDetail : eventType; // ✅ イベント詳細を考慮
    await addScore(id, inning, inningHalf, team, runs, finalEvent);
    setScores(await getScores(id)); // スコアを再取得
    resetForm();
  };

  const handleEditScore = async () => {
    if (editingScore) {
      const finalEvent = eventType === "バッティング" ? eventDetail : eventType; // ✅ イベント詳細を考慮
      await updateScore(id, editingScore.id, { inning, inningHalf, team, runs, event: finalEvent });
      setScores(await getScores(id)); // スコアを再取得
      resetForm();
    }
  };

  const handleDeleteScore = async (scoreId) => {
    if (confirm("このスコアを削除しますか？")) {
      await deleteScore(id, scoreId);
      setScores(await getScores(id)); // スコアを再取得
    }
  };

  const startEditing = (score) => {
    setEditingScore(score);
    setInning(score.inning);
    setInningHalf(score.inningHalf);
    setTeam(score.team);
    setRuns(score.runs);
    if (["ヒット", "HR", "ゴロアウト", "フライアウト"].includes(score.event)) {
      setEventType("バッティング");
      setEventDetail(score.event);
    } else {
      setEventType(score.event);
      setEventDetail("");
    }
  };

  const resetForm = () => {
    setEditingScore(null);
    setInning(1);
    setInningHalf("表");
    setTeam("");
    setRuns(0);
    setEventType("");
    setEventDetail("");
  };

  if (!game) {
    return <p className="text-center mt-10">試合データを読み込み中...</p>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-white">{game.team_home} vs {game.team_away}</h1>
      <p className="text-center text-gray-400">場所: {game.location}</p>
      <p className="text-center text-gray-400">日付: {new Date(game.date.seconds * 1000).toLocaleString()}</p>
      <p className="text-center text-gray-400">ステータス: {game.status}</p>

      {/* スコア入力フォーム */}
      <div className="mt-6 bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-white">{editingScore ? "スコアを編集" : "スコアを追加"}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <label className="block text-gray-400 text-sm mb-1">回 (inning)</label>
            <input type="number" className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600" value={inning} onChange={(e) => setInning(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">表 / 裏</label>
            <select className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600" value={inningHalf} onChange={(e) => setInningHalf(e.target.value)}>
              <option value="表">表</option>
              <option value="裏">裏</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">チーム名</label>
            <select className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">チームを選択</option>
              <option value={game.team_home}>{game.team_home}</option>
              <option value={game.team_away}>{game.team_away}</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">イベント</label>
            <select className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">選択</option>
              <option value="バッティング">バッティング</option>
              <option value="盗塁">盗塁</option>
              <option value="失策">失策</option>
            </select>
          </div>
          {eventType === "バッティング" && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">バッティング詳細</label>
              <select className="border p-2 rounded w-full bg-gray-800 text-white border-gray-600" value={eventDetail} onChange={(e) => setEventDetail(e.target.value)}>
                <option value="">詳細を選択</option>
                <option value="ヒット">ヒット</option>
                <option value="HR">ホームラン</option>
                <option value="ゴロアウト">ゴロアウト</option>
                <option value="フライアウト">フライアウト</option>
              </select>
            </div>
          )}
        </div>
        <button onClick={editingScore ? handleEditScore : handleAddScore} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full">
          {editingScore ? "更新" : "追加"}
        </button>
      </div>

      {/* 一覧に戻るボタン */}
      <button onClick={() => router.push("/")} className="mt-6 bg-gray-500 text-white px-4 py-2 rounded block mx-auto">
        一覧に戻る
      </button>
    </div>
  );
}

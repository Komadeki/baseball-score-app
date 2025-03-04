"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from "next/navigation";

export default function Home() {
  const [games, setGames] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      const querySnapshot = await getDocs(collection(db, "games"));
      const gameList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(gameList);
    };

    fetchGames();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">試合データ</h1>
      <ul className="space-y-4">
        {games.map((game) => (
          <li 
            key={game.id} 
            className="p-4 border rounded shadow cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/games/${game.id}`)}
          >
            <p className="text-lg font-semibold">
              {game.team_home} vs {game.team_away}
            </p>
            <p>場所: {game.location}</p>
            <p>日付: {new Date(game.date.seconds * 1000).toLocaleString()}</p>
            <p>ステータス: {game.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

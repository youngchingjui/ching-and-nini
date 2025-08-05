"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function DateIdeasPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Queries
  const ideas = useQuery(api.dateIdeas.list, userId ? { userId } : undefined);
  const matches = useQuery(api.dateIdeas.matches);

  // Mutations
  const createIdea = useMutation(api.dateIdeas.create);
  const toggleFav = useMutation(api.dateIdeas.toggleFavorite);

  const [newIdea, setNewIdea] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim() || !userId) return;
    await createIdea({ text: newIdea.trim(), userId });
    setNewIdea("");
  };

  const handleToggle = async (ideaId: string) => {
    if (!userId) return;
    await toggleFav({ ideaId, userId });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Date Night Ideas</h1>

      {session ? (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Add a new idea..."
            className="flex-1 border px-4 py-2 rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Add
          </button>
        </form>
      ) : (
        <p className="text-gray-500">Sign in to add and favourite ideas.</p>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4">All Ideas</h2>
        {ideas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea: any) => (
              <div
                key={idea._id}
                className="border rounded-lg p-4 flex flex-col justify-between bg-white shadow"
              >
                <p className="text-lg mb-2">{idea.text}</p>
                {userId && (
                  <button
                    onClick={() => handleToggle(idea._id)}
                    className={`self-end px-3 py-1 rounded-full text-sm ${idea.favorited ? "bg-pink-500 text-white" : "bg-gray-200"}`}
                  >
                    {idea.favorited ? "♥ Liked" : "♡ Like"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Matches</h2>
        {matches ? (
          matches.length === 0 ? (
            <p className="text-gray-500">No matches yet. Keep liking ideas!</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((idea: any) => (
                <li key={idea._id} className="bg-green-100 border border-green-300 p-3 rounded-lg">
                  {idea.text}
                </li>
              ))}
            </ul>
          )
        ) : (
          <p>Loading...</p>
        )}
      </section>
    </div>
  );
}


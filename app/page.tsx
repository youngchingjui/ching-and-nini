export const dynamic = "force-dynamic"; // This disables SSG and ISR

import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkPostTableExists } from "@/lib/db-utils";

export default async function Home() {
  // Ensure the database is set up before showing the homepage
  const tableExists = await checkPostTableExists();
  if (!tableExists) {
    redirect("/setup");
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-24 px-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mb-20">
        <h1 className="text-5xl font-extrabold text-[#333333] mb-6">
          Ching & Nini’s Collaborative App-Building Playground
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          This site is our living laboratory for building software together with the
          help of AI. Open an issue, describe what you want, and our AI coding
          agent will take it from idea ➜ pull-request. No requirement is too
          small: new features, copy tweaks, or design changes—just prompt us and
          watch the app evolve!
        </p>
      </section>

      {/* Recent Posts */}
      <h2 className="text-3xl font-bold mb-8 text-[#333333]">Recent Posts</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="group">
            <div className="border rounded-lg shadow-md bg-white p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-gray-900 group-hover:underline mb-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500">
                by {post.author ? post.author.name : "Anonymous"}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="relative">
                <p className="text-gray-700 leading-relaxed line-clamp-2">
                  {post.content || "No content available."}
                </p>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-50 to-transparent" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


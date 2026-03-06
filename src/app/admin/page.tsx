"use client";

import { useEffect, useState } from "react";

type Nominee = {
  id: string;
  label: string;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
  nominees: Nominee[];
};

export default function AdminPage() {

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {

      const res = await fetch("/api/categories");
      const data = await res.json();

      setCategories(data);

    }

    loadCategories();
  }, []);

  async function setWinner(categoryId: string, nomineeId: string) {

    await fetch("/api/winners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category_id: categoryId,
        nominee_id: nomineeId
      })
    });

    alert("Ganador guardado");

  }

  return (

    <main style={{maxWidth:900, margin:"40px auto", fontFamily:"sans-serif"}}>

      <h1>Admin — Ganadores Oscars</h1>

      {categories.map((cat) => (

        <div key={cat.id} style={{marginBottom:40}}>

          <h2>
            {cat.sort_order}. {cat.name}
          </h2>

          {cat.nominees.map((n) => (

            <label key={n.id} style={{display:"block", margin:"6px 0"}}>

              <input
                type="radio"
                name={cat.id}
                onChange={() => setWinner(cat.id, n.id)}
              />

              {" "}
              {n.label}

            </label>

          ))}

        </div>

      ))}

    </main>

  );

}
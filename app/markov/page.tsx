"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [input, setInput] = useState("");
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [prediction, setPrediction] = useState<
    { num: number; prob: number }[]
  >([]);
  const [chartData, setChartData] = useState<{ num: number; prob: number }[]>(
    []
  );

  // Build 100x100 transition matrix
  const buildMatrix = (records: number[]) => {
    const size = 100;
    const counts = Array.from({ length: size }, () =>
      Array(size).fill(0)
    );

    // Count transitions
    for (let i = 0; i < records.length - 1; i++) {
      const from = records[i];
      const to = records[i + 1];
      if (from >= 0 && from < size && to >= 0 && to < size) {
        counts[from][to] += 1;
      }
    }

    // Normalize to probabilities
    return counts.map((row) => {
      const sum = row.reduce((a, b) => a + b, 0);
      return sum > 0 ? row.map((x) => x / sum) : row;
    });
  };

  // Auto-update predictions + chart when input changes
  useEffect(() => {
    const records = input
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (records.length < 2) {
      setMatrix([]);
      setPrediction([]);
      setChartData([]);
      return;
    }

    const probs = buildMatrix(records);
    setMatrix(probs);

    const last = records[records.length - 1];
    const row = probs[last];

    // Find top 3 next states
    const ranked = row
      .map((p, i) => ({ num: i, prob: p }))
      .filter((d) => d.prob > 0)
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 3);

    setPrediction(ranked);

    // Full chart data (all 0–99)
    const chart = row.map((p, i) => ({ num: i, prob: p }));
    setChartData(chart);
  }, [input]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Markov Chain Predictor (0–99)</h1>

      <textarea
        className="w-full max-w-xl p-3 border rounded-md mb-4"
        rows={4}
        placeholder="Enter numbers separated by commas, e.g. 3,5,6,7,9,8,3,2,5,6"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {prediction.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow w-full max-w-xl">
          <h2 className="text-lg font-semibold">Top 3 Predicted Next Numbers:</h2>
          <ul className="mt-2 space-y-1">
            {prediction.map((p, idx) => (
              <li key={idx} className="text-lg">
                <span className="font-bold text-blue-600">{p.num}</span>{" "}
                <span className="text-gray-600">
                  ({(p.prob * 100).toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow w-full max-w-4xl">
          <h2 className="text-lg font-semibold mb-2">
            Probability Distribution for Next Number
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="num" tick={{ fontSize: 10 }} interval={9} />
              <YAxis />
              <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
              <Bar dataKey="prob" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {matrix.length > 0 && (
        <div className="mt-6 overflow-x-auto max-w-full">
          <h2 className="text-lg font-semibold mb-2">
            Transition Matrix (first 10 rows preview)
          </h2>
          <table className="table-auto border-collapse border border-gray-400 text-sm">
            <tbody>
              {matrix.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 bg-gray-200 font-bold">{i}</td>
                  {row.slice(0, 10).map((val, j) => (
                    <td key={j} className="border px-2 py-1 text-center">
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs mt-2 text-gray-500">
            Showing only first 10×10 slice of the 100×100 matrix for readability.
          </p>
        </div>
      )}
    </main>
  );
}

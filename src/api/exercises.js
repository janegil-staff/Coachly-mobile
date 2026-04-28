// src/api/exercises.js
// Thin wrapper that delegates to services/api.js — keeps imports stable
// for the screen while using the project's fetch-based pattern.

import { exercisesApi } from "../services/api";

export async function fetchCustomExercises() {
  const list = await exercisesApi.listCustom();
  return { exercises: list };
}

export async function createCustomExercise({ name, category }) {
  const exercise = await exercisesApi.createCustom({ name, category });
  return { exercise };
}

export async function deleteCustomExercise(id) {
  return exercisesApi.deleteCustom(id);
}
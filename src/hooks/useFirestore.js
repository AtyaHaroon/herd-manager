import { useState, useCallback } from "react";
import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
} from "../firebase/firestore";

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data with optional farmId filter
  const fetchAll = useCallback(
    async (filters = []) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCollection(collectionName, filters);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const fetchOne = useCallback(
    async (id) => {
      setLoading(true);
      try {
        return await getDocument(collectionName, id);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const add = useCallback(
    async (data) => {
      setLoading(true);
      try {
        const id = await addDocument(collectionName, data);
        return id;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const update = useCallback(
    async (id, data) => {
      setLoading(true);
      try {
        await updateDocument(collectionName, id, data);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const remove = useCallback(
    async (id) => {
      setLoading(true);
      try {
        await deleteDocument(collectionName, id);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  return { data, loading, error, fetchAll, fetchOne, add, update, remove };
};

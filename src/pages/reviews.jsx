import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

export default function Reviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const headers = {};
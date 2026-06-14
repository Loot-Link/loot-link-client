import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./session-reviews.css";

const API = import.meta.env.VITE_API;
const descriptorOptions = ["Friendly", "Good Teammate", "Fun", "Rude", "Comms Abuse"];

function getDefaultMemberRatings(members) {
  const initialRatings = {};
  members.forEach((member) => {
    initialRatings[member.user_id] = { descriptors: [], note: "" };
  });
  return initialRatings;
}

export default function SessionReviewModal({ sessionId, sessionUsers, currentUserId, isOpen, onClose }) {
  const { token } = useAuth();
  const visibleMembers = useMemo(
    () => sessionUsers.filter((member) => Number(member.user_id) !== Number(currentUserId)),
    [sessionUsers, currentUserId]
  );

  const visibleMembersRef = useRef(visibleMembers);

  useEffect(() => {
    visibleMembersRef.current = visibleMembers;
  }, [visibleMembers]);

  const [sessionRating, setSessionRating] = useState(0);
  const [memberRatings, setMemberRatings] = useState(() => getDefaultMemberRatings(visibleMembers));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (loading) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading]);

  const loadExistingReview = useCallback(async (members) => {
    const initialRatings = getDefaultMemberRatings(members);
    setSessionRating(0);
    setMemberRatings(initialRatings);
    setError("");

    try {
      const response = await fetch(`${API}/session-reviews/${sessionId}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to fetch existing session review.");
      }

      const review = await response.json();
      if (!review) return;

      setSessionRating(review.session_rating || 0);
      const ratings = getDefaultMemberRatings(members);
      (review.member_ratings || []).forEach((memberRating) => {
        ratings[memberRating.user_id] = {
          descriptors: Array.isArray(memberRating.descriptors) ? memberRating.descriptors : [],
          note: memberRating.note || "",
        };
      });
      setMemberRatings(ratings);
    } catch (err) {
      console.error("Failed to load existing session review:", err);
      setError("Could not load your existing review.");
    }
  }, [sessionId, token]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const timer = setTimeout(() => {
      void loadExistingReview(visibleMembersRef.current);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, sessionId, loadExistingReview]);

  if (!isOpen) return null;

  const toggleDescriptor = (memberId, descriptor) => {
    setMemberRatings((prevRatings) => {
      const current = prevRatings[memberId] || { descriptors: [], note: "" };
      const isActive = current.descriptors.includes(descriptor);
      return {
        ...prevRatings,
        [memberId]: {
          ...current,
          descriptors: isActive
            ? current.descriptors.filter((value) => value !== descriptor)
            : [...current.descriptors, descriptor],
        },
      };
    });
  };

  const handleNoteChange = (memberId, note) => {
    setMemberRatings((prevRatings) => ({
      ...prevRatings,
      [memberId]: {
        ...prevRatings[memberId],
        note,
      },
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!sessionRating) {
      setError("Please rate the session with 1 to 5 stars.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        session_id: sessionId,
        session_rating: sessionRating,
        member_ratings: visibleMembers.map((member) => ({
          user_id: Number(member.user_id),
          descriptors: memberRatings[member.user_id]?.descriptors || [],
          note: memberRatings[member.user_id]?.note || "",
        })),
      };

      const response = await fetch(`${API}/session-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to submit session review.");
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit session review.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal" onClick={(event) => event.stopPropagation()}>
        <div className="review-modal__header">
          <div>
            <h2>Session Feedback</h2>
            <p>Rate the session and tag teammates with descriptors.</p>
          </div>
          <button className="review-modal__close" onClick={onClose} aria-label="Close review modal">
            ×
          </button>
        </div>

        <div className="review-modal__body">
          <section className="review-section">
            <h3>Overall Session Rating</h3>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`review-star ${sessionRating >= value ? "review-star--selected" : ""}`}
                  onClick={() => setSessionRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
          </section>

          <section className="review-section">
            <h3>Rate Players</h3>
            {visibleMembers.length === 0 ? (
              <p className="review-empty">There are no other players to review yet.</p>
            ) : (
              visibleMembers.map((member) => {
                const ratings = memberRatings[member.user_id] || { descriptors: [], note: "" };
                return (
                  <div key={member.user_id} className="review-player-card">
                    <div className="review-player-card__header">
                      <span>{member.username}</span>
                    </div>
                    <div className="review-descriptors">
                      {descriptorOptions.map((descriptor) => {
                        const isActive = ratings.descriptors.includes(descriptor);
                        return (
                          <button
                            type="button"
                            key={descriptor}
                            className={`review-descriptor-button ${isActive ? "review-descriptor-button--active" : ""}`}
                            onClick={() => toggleDescriptor(member.user_id, descriptor)}
                          >
                            {descriptor}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      className="review-player-note"
                      placeholder="Add a short note (optional)"
                      value={ratings.note}
                      onChange={(event) => handleNoteChange(member.user_id, event.target.value)}
                    />
                  </div>
                );
              })
            )}
          </section>
        </div>

        {error && <div className="review-error">{error}</div>}

        <div className="review-modal__footer">
          <button className="review-cancel-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="review-submit-button" onClick={handleSubmit} type="button" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

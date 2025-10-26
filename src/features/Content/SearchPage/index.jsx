import React from "react";
import Header from "./Header";

// Dummy data for people listing
const people = [
  {
    id: 1,
    name: "Khaizer Noguera",
    username: "@khaizerdn",
    mutualFriends: 20,
    mutualGames: 2,
    avatar: "https://via.placeholder.com/50"
  },
  {
    id: 2,
    name: "Khaizer Noguera",
    username: "@khaizerdn",
    mutualFriends: 20,
    mutualGames: 2,
    avatar: "https://via.placeholder.com/50"
  },
  {
    id: 3,
    name: "Khaizer Noguera",
    username: "@khaizerdn",
    mutualFriends: 20,
    mutualGames: 2,
    avatar: "https://via.placeholder.com/50"
  },
  {
    id: 4,
    name: "Khaizer Noguera",
    username: "@khaizerdn",
    mutualFriends: 20,
    mutualGames: 2,
    avatar: "https://via.placeholder.com/50"
  }
];

function Main() {
  return (
    <>
      <Header />
      <div className="people-list">
        {people.map((person) => (
          <div className="person-card" key={person.id}>
            {/* Left: avatar */}
            <img src={person.avatar} alt={person.name} className="person-avatar" />

            {/* Middle: info */}
            <div className="person-info">
              <h4 className="person-name">{person.name}</h4>
              <p className="person-username">{person.username}</p>
              <div className="person-tags">
                <span>{person.mutualFriends} Mutual Friends</span>
                <span>{person.mutualGames} Mutual Games</span>
              </div>
            </div>

            {/* Right: action button */}
            <button className="add-friend-btn">Add Friend</button>
          </div>
        ))}
      </div>

      {/* Styles inside the same file */}
      <style>{`
        .people-list {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }

        .person-card {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          justify-content: space-between;
          cursor: pointer;
          position: relative;
        }

        /* Divider line */
        .person-card::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: var(--border-radius); /* indent after avatar */
          right: var(--border-radius); /* leave space on the right */
          height: 1px;
          background-color: var(--background-color-3);
        }

        /* Remove line from the last card */
        .person-card:last-child::after {
          display: none;
        }

        .person-card:hover {
          background-color: var(--background-color-3);
          border-radius: var(--border-radius);
        }

        .person-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 16px;
        }

        .person-info {
          flex: 1;
        }

        .person-name {
          font-size: var(--font-size-016);
          color: var(--font-color-default);
          margin: 0;
        }

        .person-username {
          font-size: var(--font-size-014);
          color: var(--font-color-muted);
          margin: 2px 0;
        }

        .person-tags {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .person-tags span {
          background-color: var(--background-color-4);
          color: var(--font-color-muted);
          font-size: var(--font-size-012);
          padding: 2px 8px;
          border-radius: var(--border-radius);
        }

        .add-friend-btn {
          background-color: var(--font-color-default);
          color: var(--color-max-dark);
          border: none;
          border-radius: var(--border-radius);
          padding: 7px 14px;
          font-size: var(--font-size-014);
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .add-friend-btn:hover {
          background-color: var(--font-color-muted);
        }
      `}</style>
    </>
  );
}

export default Main;

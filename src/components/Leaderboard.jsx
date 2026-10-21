export default function Leaderboard({ players = [], scores = {} }) {
  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <div className="leaderboard-list">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className={`leaderboard-item ${index === 0 ? 'first-place' : ''}`}>
            <span className="rank">#{index + 1}</span>
            <span className="player-name">{player.name}</span>
            <span className="player-score">{scores[player.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import "./styles.css";

import TopInfo from "./TopInfo";
import FavoriteGames from "./FavoriteGames";
import Schedules from "./Schedules";
import Achievements from "./Achievements";

const AboutTab = () => {
  return (
    <div className="about-tab">
      <TopInfo />
      <FavoriteGames />
      <Schedules />
      <Achievements />
    </div>
  );
};

export default AboutTab;

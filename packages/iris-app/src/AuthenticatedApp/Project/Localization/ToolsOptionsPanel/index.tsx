import React from "react";

import { useSelector } from "react-redux";

import { RootState } from "@iris/store";

import styles from "./ToolOptionsPanel.module.css";

function ToolOptionsPanel() {
  const tool = useSelector(
    (state: RootState) =>
      state.ui.selectedTool ?? window.IRIS.tools.list()[1].id
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.divider} />
      {window.IRIS.tools
        .get(tool)
        .options.list()
        .map((option, i) => {
          return (
            <React.Fragment key={i}>
              {option.component}
              <div className={styles.divider} />
            </React.Fragment>
          );
        })}
    </div>
  );
}

export default ToolOptionsPanel;

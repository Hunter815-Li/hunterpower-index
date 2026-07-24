"use client";

type Language = "zh" | "en";
type Theme = "light" | "dark";

export function DisplayPreferences() {
  function updateLanguage(next: Language) {
    document.documentElement.dataset.language = next;
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    localStorage.setItem("taotalk-language", next);
  }

  function updateTheme(next: Theme) {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("taotalk-theme", next);
  }

  return (
    <details className="display-preferences">
      <summary aria-label="语言与外观设置">
        <span aria-hidden="true">Aa</span>
        <span className="lang-zh">显示</span>
        <span className="lang-en">Display</span>
      </summary>
      <div className="preferences-panel">
        <fieldset>
          <legend>LANGUAGE / 语言</legend>
          <div>
            <button className="preference-language-zh" type="button" onClick={() => updateLanguage("zh")}>中文</button>
            <button className="preference-language-en" type="button" onClick={() => updateLanguage("en")}>English</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>APPEARANCE / 外观</legend>
          <div>
            <button className="preference-theme-light" type="button" onClick={() => updateTheme("light")}>浅色</button>
            <button className="preference-theme-dark" type="button" onClick={() => updateTheme("dark")}>深色</button>
          </div>
        </fieldset>
      </div>
    </details>
  );
}

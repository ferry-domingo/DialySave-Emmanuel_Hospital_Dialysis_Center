const Loader = ({ fullScreen = false, label = "Loading..." }) => {
  return (
    <div
      className={fullScreen ? "app-loader app-loader-fullscreen" : "app-loader"}
      role="status"
      aria-live="polite"
    >
      <div className="loader-logo-wrap">
        <span className="loader-ring" aria-hidden="true" />
        <img src="/images/logo.png" alt="" className="loader-logo" />
      </div>
      <p>{label}</p>
    </div>
  );
};

export default Loader;

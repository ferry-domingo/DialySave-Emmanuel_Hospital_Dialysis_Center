const UserAvatar = ({ user, className = "h-10 w-10", name, children }) => {
  const label = name || user?.username || "User";

  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-500 ${className}`}>
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt={`${label}'s profile`} className="h-full w-full rounded-full object-cover" />
      ) : (
        label.charAt(0).toUpperCase()
      )}
      {children}
    </span>
  );
};

export default UserAvatar;

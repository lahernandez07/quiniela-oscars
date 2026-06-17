type TeamFlagProps = {
  code: string;
  name: string;
  style?: React.CSSProperties;
};

const specialFlags: Record<string, string> = {
  "gb-eng": "/flags/england.svg",
  "gb-sct": "/flags/scotland.svg",
};

export default function TeamFlag({ code, name, style }: TeamFlagProps) {
  const src = specialFlags[code] ?? `https://flagcdn.com/w80/${code}.png`;

  return (
    <img
      src={src}
      alt={name}
      title={name}
      loading="lazy"
      style={style}
    />
  );
}
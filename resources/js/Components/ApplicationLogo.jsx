// resources/js/Components/ApplicationLogo.jsx
export default function ApplicationLogo(props) {
  return (
    <img
      {...props}
      src="/images/icono.jpg"
      alt="Huellas Solidarias"
      className={props.className ?? 'h-8 w-8'}
      width={32}
      height={32}
    />
  );
}
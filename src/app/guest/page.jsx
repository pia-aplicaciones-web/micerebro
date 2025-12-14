export default function GuestPage() {
  // Esta página redirige inmediatamente usando headers HTTP
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/board/guest_redirect/',
      permanent: false,
    },
  };
}
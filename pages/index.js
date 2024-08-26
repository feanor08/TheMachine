import Head from "next/head";
import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { getSession } from "@auth0/nextjs-auth0";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { MachineLogo } from "components/MachineLogo";
import Image from 'next/image';



export default function Home() {
  const { isLoading, error, user } = useUser();
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>
  return (
    <>
      <Head>
        <title>The Machine</title>
      </Head>
      <div className="flex justify-center items-center min-h-screen w-full bg-black text-white text-center">
        <div>
          <div className="flex items-center justify-center ">
            <MachineLogo />
          </div>
          <h1 className="text-4xl font-bold mt-2 uppercase">
            Can you hear me?
          </h1>
          <div
            className="mt-4 flex justify-center gap-3">
            {!user && (
              <>
                <Link href="/api/auth/login" className="btn">Login</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}



export const getServerSideProps = async (context) => {
  const session = await getSession(context.req, context.res);
  if (!!session) {
    return {
      redirect: {
        destination: "/chat"
      }
    }
  }
  return {
    props: {},
  }
}
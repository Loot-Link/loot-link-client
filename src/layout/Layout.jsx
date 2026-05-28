import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import NotificationBanner from "./NotificationBanner";

/** The shared layout for all pages of the app */
export default function Layout() {
  // return (
  //   <div className="app-shell">
  //     <div className="app-frame">
  //       <NotificationBanner />
  //       <Navbar />
  //       <main>
  //         <Outlet />
  //       </main>
  //     </div>
  //   </div>
  // );
  return (
    <>
      <NotificationBanner />

      <div className="app-shell">
        <div className="app-frame">
          <Navbar />
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}


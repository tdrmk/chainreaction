import NotFound from "./pages/default";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";

import debug from "debug";
import HomePage from "./pages/home";
import GamePage from "./pages/game";
import { ignoreErr } from "./utils/error";

let log = debug("chainreaction:router");

/*
  - public, access allowed when no authenticated users
  - private, protected routes, needs authentication
  - optional, available with/without authentication

  if access level not met, `redirect` is used to direct to appropriate page.
*/

const ACCESS = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  OPTIONAL: "OPTIONAL",
};

const ROUTES = [
  {
    path: "/",
    page: HomePage,
    access: ACCESS.OPTIONAL,
    redirect: "/login",
  },
  {
    path: "/home",
    page: HomePage,
    access: ACCESS.OPTIONAL,
    redirect: "/login",
  },
  {
    path: "/game/:gameid",
    page: GamePage,
    access: ACCESS.PRIVATE,
    redirect: "/login",
  },
  {
    path: "/login",
    page: LoginPage,
    access: ACCESS.PUBLIC,
    redirect: "/home",
  },
  {
    path: "/signup",
    page: SignupPage,
    access: ACCESS.PUBLIC,
    redirect: "/home",
  },
  {
    path: /^.*$/, // match all, default route
    page: NotFound,
    access: ACCESS.OPTIONAL,
  },
];

let lastpage; // keeps track of last rendered page

// https://www.youtube.com/watch?v=6BozpmSjk-Y
// https://www.youtube.com/watch?v=OstALBk-jTc
export default async function router() {
  // find the matching route
  const routematch = ROUTES.map((route) => {
    const match = location.pathname.match(pathToRegex(route.path));
    return {
      route,
      ismatch: Boolean(match),
      params: match?.groups,
    };
  }).find(({ ismatch }) => ismatch);

  // ignore cache initial load
  const ignoreCache = !lastpage;
  const userinfo = await fetchCachedUserInfo(ignoreCache);

  const { access } = routematch.route;
  if (access === ACCESS.PUBLIC && userinfo) {
    // not accessible to logged users
    saveCurrentPath();
    return navigateTo(routematch.route.redirect);
  }
  if (access === ACCESS.PRIVATE && !userinfo) {
    // protected routes
    saveCurrentPath();
    return navigateTo(routematch.route.redirect);
  }

  // url search params
  const search = Object.fromEntries(new URL(window.location).searchParams);

  // path params take precedence over search params
  const page = new routematch.route.page(
    { ...search, ...routematch.params },
    userinfo
  );

  // overlay a loader till new page is mounted
  // (let the skeleton loader be shown during initial load)
  if (lastpage)
    document
      .querySelector("#app")
      .appendChild(document.createElement("app-spinner"));

  // unmount prev page, giving at a opportunity to cleanup
  if (lastpage) lastpage.unmount();
  lastpage = page;

  // await new Promise((resolve) => setTimeout(resolve, 5000));
  // render new page
  const root = await page.render();
  document.querySelector("#app").replaceChildren(root);
}

function pathToRegex(path) {
  if (path instanceof RegExp) return path;
  return new RegExp(
    "^" + path.replace(/\//g, "\\/").replace(/:(\w+)/g, "(?<$1>[\\w-]+)") + "$"
  );
}

/*
  fetches user info and caches them for 1hour.
  This function is more inclined towards logging in the user.
*/

const USER_INFO = "user-info";
async function fetchCachedUserInfo(ignoreCache = false) {
  const getExpiryDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  };

  const checkIsExpired = (date) => {
    return Date.now() >= new Date(date).getTime();
  };

  if (ignoreCache) {
    ignoreErr(() => sessionStorage.removeItem(USER_INFO));
    log("cache invalidated!");
  } else {
    const cachedinfo = JSON.parse(
      ignoreErr(() => sessionStorage.getItem(USER_INFO))
    );
    if (cachedinfo) {
      const { expires, ...userinfo } = cachedinfo;
      if (!checkIsExpired(expires)) {
        log("using cached user info!");
        return userinfo;
      }
      log("cached user info expired");
    }
  }

  const response = await fetch("/user/details");

  if (response.ok) {
    log("fetched user details");
    const userinfo = await response.json();
    const expires = getExpiryDate();
    ignoreErr(() =>
      sessionStorage.setItem(
        USER_INFO,
        JSON.stringify({ ...userinfo, expires })
      )
    );
    return userinfo;
  }

  log("user not logged in");
}

const REDIRECT_LINK = "redirect-link";
function saveCurrentPath() {
  ignoreErr(() => {
    sessionStorage.setItem(REDIRECT_LINK, location.pathname);
  });
}

export function loadSavedPath() {
  return ignoreErr(() => {
    const link = sessionStorage.getItem(REDIRECT_LINK);
    sessionStorage.removeItem(REDIRECT_LINK);
    return link;
  });
}

export function navigateTo(url, state = null) {
  history.pushState(state, null, url);
  router();
}

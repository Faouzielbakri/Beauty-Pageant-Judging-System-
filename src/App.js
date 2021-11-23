import { database, auth } from "./firebase";
import { useEffect, useState } from "react";
import "./App.css";
import "./styles.css";
import { AdminEmail } from "./constants";
import Judge from "./Judge";
import Admin from "./Admin";

function App() {
  const [user, setuser] = useState({});
  //auth listener
  useEffect(() => {
    const authSub = auth().onAuthStateChanged((userInfo) => {
      // console.log(userInfo);
      if (userInfo) {
        setuser(userInfo);
        database
          .collection("Judges")
          .doc(`${userInfo.uid}`)
          .get()
          .then((doc) => {
            if (!doc.exists) {
              database
                .collection("Judges")
                .doc(`${userInfo.uid}`)
                .set({
                  email: userInfo?.email ? userInfo?.email : "email",
                });
            }
          });
      } else {
        setuser({});
      }
    });
    return authSub;
  }, []);
  //authentication
  const Login = (e) => {
    e.preventDefault();
    console.log(e.target[0].value, e.target[1].value);
    auth().signInWithEmailAndPassword(e.target[0].value, e.target[1].value);
  };

  if (JSON.stringify(user) !== "{}") {
    if (user.email === AdminEmail) return <Admin />;
    else return <Judge />;
  }
  return (
    <div className="App">
      <div class="admin_div" id="admin">
        <form onSubmit={Login}>
          <span>Login</span>
          <input type="text" name="username" placeholder="Username" />
          <input type="password" name="password" placeholder="Password" />
          <span id="error"></span>
          <input type="submit" />
        </form>
      </div>
    </div>
  );
}

export default App;

import { database, auth } from "./firebase";
import { useEffect, useState } from "react";
import "./App.css";
import "./styles.css";
import { AdminEmail } from "./constants";
import Judge from "./Judge";
import Admin from "./Admin";

function App() {
  const [user, setuser] = useState({});
  //authentication  listener (get called when ever the authentication state changed (loged in or signed out))
  useEffect(() => {
    const authSub = auth().onAuthStateChanged((userInfo) => {
      if (userInfo) {
        //store user info into variable
        setuser(userInfo);
        //if user is loged in write his email to the DB
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
        //delete user info stored  into the user variable
        setuser({});
      }
    });
    return authSub;
  }, []);
  //authentication
  const Login = (e) => {
    //login form function to handle the login
    e.preventDefault();
    console.log(e.target[0].value, e.target[1].value);
    auth().signInWithEmailAndPassword(e.target[0].value, e.target[1].value);
  };

  if (JSON.stringify(user) !== "{}") {
    //if the email is equal to teh admin email forward to admin page
    if (user.email === AdminEmail) return <Admin />;
    //else to judge page
    else return <Judge />;
  }
  //if not logged show the login form
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

import { database, auth } from "./firebase";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

function Admin() {
  const [males, setmales] = useState([]);
  const [females, setfemales] = useState([]);
  const [maleIndex, setmaleIndex] = useState(0);
  const [femaleIndex, setfemaleIndex] = useState(0);
  const [round, setround] = useState(1);
  const [scoresStatemale, setscoresmale] = useState({});
  const [scoresStatefemale, setscoresfemale] = useState({});
  const [finalScoreStatemale, setfinalScoremale] = useState({});

  const [finalScoreStatefemale, setfinalScorefemale] = useState({});
  const [modalIsOpen, setmodalIsOpen] = useState(false);
  const [topfemales, settopfemales] = useState([]);
  const [topmales, settopmales] = useState([]);
  const [top, settop] = useState([]);
  const [CurrentGendre, setCurrentGendre] = useState("male");
  const [curentmale, setcurentmale] = useState({});
  const [curentfemale, setcurentfemale] = useState({});

  useEffect(() => {
    const sub = database
      .collection("currentContestants")
      .orderBy("ContestantNo")
      .onSnapshot((snapShot) => {
        if (!snapShot?.empty) {
          snapShot.forEach((contestant) => {
            //seperate the applications based on gendre
            if (contestant?.data().Gender === "male") {
              setcurentmale({ id: contestant.id, ...contestant.data() });
            } else {
              setcurentfemale({ id: contestant.id, ...contestant.data() });
            }
          });
        } else {
        }
      });
    return sub;
  }, []);

  //get all accepted applications ordered By contestant No.

  useEffect(() => {
    const collectionName = round > 2 ? "TopQualified" : "AcceptedApplications";
    const sub = database
      .collection(collectionName)
      .orderBy("ContestantNo")
      .onSnapshot((snapShot) => {
        if (!snapShot?.empty) {
          const male_list = [];
          const femmale_list = [];
          console.log(snapShot.size);
          snapShot.forEach((contestant) => {
            //seperate the applications based on gendre

            if (contestant?.data().Gender === "male") {
              male_list.push({ id: contestant.id, ...contestant.data() });
            } else {
              femmale_list.push({ id: contestant.id, ...contestant.data() });
            }
          });
          setmales(male_list);
          setfemales(femmale_list);
        } else {
          alert(
            "no on is qualified to round 3 and 4\nmaybe ask to admin to calculte scores and move the contestants to round 3"
          );
        }
      });
    return sub;
  }, [round]);
  //get current round
  useEffect(() => {
    const sub = database
      .collection("Round")
      .doc("round")
      .onSnapshot((doc) => {
        if (doc.data() && doc.data()?.round) {
          setround(doc.data().round);
        } else {
          setround(1);
        }
      });
    return sub;
  }, []);
  //reset when round changed
  useEffect(() => {
    setmaleIndex(0);
    setfemaleIndex(0);
    setfinalScoremale({});
    setfinalScorefemale({});
  }, [round]);

  //move qualified to qualified collection
  const registerTopQualified = () => {
    let trigger = false;
    database
      .collection("TopQualified")
      .where("Gender", "==", CurrentGendre)
      .get()
      .then((snapShot) => {
        if (snapShot.size !== 0) {
          snapShot.forEach((Doc) => {
            Doc.ref.delete();
          });
          trigger = true;
        } else {
          if (CurrentGendre === "male") {
            topmales.forEach((element) => {
              database
                .collection("TopQualified")
                .doc(`${element?.id}`)
                .set(element);
            });
          } else {
            topfemales.forEach((element) => {
              database
                .collection("TopQualified")
                .doc(`${element?.id}`)
                .set(element);
            });
          }
        }
      })
      .finally(() => {
        if (trigger)
          setTimeout(() => {
            registerTopQualified();
          }, 1000);
        trigger = false;
      })
      .finally(() => {
        alert("Finished");
      });
  };
  //get placement text
  const placementtext = (placement) => {
    const last_digit = String(placement).split(".")[0].slice(-1);
    if (Number(last_digit) === 1) {
      if (String(placement).length === 1) {
        return "First place";
      } else {
        return `${placement}st`;
      }
    } else if (Number(last_digit) === 2) {
      if (String(placement).length === 1) {
        return "Second place";
      } else {
        return `${placement}nd`;
      }
    } else if (Number(last_digit) === 3) {
      if (String(placement).length === 1) {
        return "third place";
      } else {
        return `${placement}rd`;
      }
    }

    return `${placement}th`;
  };
  //get top from list
  const getTopmales = () => {
    let result = [];

    round === 2 &&
      JSON.stringify(finalScoreStatemale) !== "{}" &&
      Object.keys(finalScoreStatemale)
        .sort((a, b) => finalScoreStatemale[a] - finalScoreStatemale[b])
        .reverse()
        .forEach((key, index) => {
          males.concat(females).forEach((human) => {
            if (human.ContestantNo === Number(key)) {
              result.push(human);
            }
          });
        });
    round === 4 &&
      JSON.stringify(finalScoreStatemale) !== "{}" &&
      Object.keys(finalScoreStatemale)
        .sort((a, b) => finalScoreStatemale[a] - finalScoreStatemale[b])
        .reverse()
        .forEach((key, index) => {
          males.concat(females).forEach((human) => {
            if (human.ContestantNo === Number(key)) {
              result.push(human);
            }
          });
        });
    console.log(result);
    if (Array.isArray(result))
      return result.filter((n) => n).slice(0, round < 3 ? 5 : 3);
    else return "Calculate Scores First";
  };
  const getTopfemales = () => {
    let result = [];
    round === 2 &&
      JSON.stringify(finalScoreStatefemale) !== "{}" &&
      Object.keys(finalScoreStatefemale)
        .sort((a, b) => finalScoreStatefemale[a] - finalScoreStatefemale[b])
        .reverse()
        .forEach((key, index) => {
          males.concat(females).forEach((human) => {
            if (human.ContestantNo === Number(key)) {
              result.push(human);
            }
          });
        });
    round === 4 &&
      JSON.stringify(finalScoreStatefemale) !== "{}" &&
      Object.keys(finalScoreStatefemale)
        .sort((a, b) => finalScoreStatefemale[a] - finalScoreStatefemale[b])
        .reverse()
        .forEach((key, index) => {
          males.concat(females).forEach((human) => {
            if (human.ContestantNo === Number(key)) {
              result.push(human);
            }
          });
        });
    console.log(result);
    if (Array.isArray(result))
      return result.filter((n) => n).slice(0, round < 3 ? 5 : 3);
    else return "Calculate Scores First";
  };
  //get score from round number and ata obj
  const getContestantScore = (rnd, data) => {
    switch (rnd) {
      case 1:
        return data[`round1`] ? Number(data[`round1`]) : 0;
      case 2:
        return data[`round2`]
          ? data[`round1`]
            ? Number(data[`round2`]) + Number(data[`round1`])
            : Number(data[`round2`])
          : data[`round1`]
          ? Number(data[`round2`]) + Number(data[`round1`])
          : 0;
      case 3:
        if (data[`round3`]) {
          if (data[`round2`]) {
            if (data[`round1`]) {
              return data[`round1`] + data[`round2`] + data[`round3`];
            } else {
              return data[`round2`] + data[`round3`];
            }
          } else {
            if (data[`round1`]) {
              return data[`round1`] + data[`round3`];
            } else {
              return data[`round3`];
            }
          }
        } else {
          if (data[`round2`]) {
            if (data[`round1`]) {
              return data[`round1`] + data[`round2`];
            } else {
              return 0;
            }
          } else {
            if (data[`round1`]) {
              return data[`round1`];
            } else {
              return 0;
            }
          }
        }
      case 4:
        if (data[`round4`]) {
          if (data[`round3`]) {
            if (data[`round2`]) {
              if (data[`round1`]) {
                return (
                  data[`round1`] +
                  data[`round2`] +
                  data[`round3`] +
                  data[`round4`]
                );
              } else {
                return data[`round2`] + data[`round3`] + data[`round4`];
              }
            } else {
              if (data[`round1`]) {
                return data[`round1`] + data[`round3`] + data[`round4`];
              } else {
                return data[`round3`] + data[`round4`];
              }
            }
          } else {
            if (data[`round2`]) {
              if (data[`round1`]) {
                return data[`round1`] + data[`round2`] + data[`round4`];
              } else {
                return 0 + data[`round4`];
              }
            } else {
              if (data[`round1`]) {
                return data[`round1`] + data[`round4`];
              } else {
                return 0 + data[`round4`];
              }
            }
          }
        } else {
          if (data[`round3`]) {
            if (data[`round2`]) {
              if (data[`round1`]) {
                return data[`round1`] + data[`round2`] + data[`round3`];
              } else {
                return data[`round2`] + data[`round3`];
              }
            } else {
              if (data[`round1`]) {
                return data[`round1`] + data[`round3`];
              } else {
                return data[`round3`];
              }
            }
          } else {
            if (data[`round2`]) {
              if (data[`round1`]) {
                return data[`round1`] + data[`round2`];
              } else {
                return 0;
              }
            } else {
              if (data[`round1`]) {
                return data[`round1`];
              } else {
                return 0;
              }
            }
          }
        }

      default:
        return 0;
    }
  };

  //calculte the current round score
  const currentRoundScoresCalculator = async () => {
    let scores = {};

    males.forEach((m) => {
      scores[`${m?.ContestantNo}`] = 0;
    });

    // var groupedArray = males.concat(females);
    males.forEach((element) => {
      database
        .collection("Judges")
        .get()
        .then((judgeRef) => {
          if (!judgeRef.empty) {
            judgeRef.forEach((judge) => {
              judge.ref
                .collection("marks")
                .where("ContestantNo", "==", element.ContestantNo)
                .where("Gender", "==", "male")
                .get()
                .then((marksRef) => {
                  if (!marksRef.empty) {
                    marksRef.forEach((contest) => {
                      var tempJudgeHolder = scoresStatemale;
                      if (
                        tempJudgeHolder[`${judge.id}`] === {} ||
                        tempJudgeHolder[`${judge.id}`] !== undefined
                      ) {
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      } else {
                        tempJudgeHolder[`${judge.id}`] = {};
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      }

                      setscoresmale({ ...tempJudgeHolder });
                    });
                  }
                });
            });
            var finalScore = {};
            Object.keys(scoresStatemale).forEach((key) => {
              // console.log(scores, key);
              Object.keys(scoresStatemale[key]).forEach((subKey) => {
                if (finalScore[subKey]) {
                  finalScore[subKey] += scoresStatemale[key][subKey];
                } else {
                  finalScore[subKey] = scoresStatemale[key][subKey];
                }
              });
            });
            setfinalScoremale(finalScore);
          }
        });
    });

    scores = {};
    females.forEach((m) => {
      scores[`${m?.ContestantNo}`] = 0;
    });
    females.forEach((element) => {
      database
        .collection("Judges")
        .get()
        .then((judgeRef) => {
          if (!judgeRef.empty) {
            judgeRef.forEach((judge) => {
              judge.ref
                .collection("marks")
                .where("ContestantNo", "==", element.ContestantNo)
                .where("Gender", "==", "female")
                .get()
                .then((marksRef) => {
                  if (!marksRef.empty) {
                    // console.log("finalScore", females.length);
                    marksRef.forEach((contest) => {
                      var tempJudgeHolder = scoresStatefemale;
                      if (
                        tempJudgeHolder[`${judge.id}`] === {} ||
                        tempJudgeHolder[`${judge.id}`] !== undefined
                      ) {
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      } else {
                        tempJudgeHolder[`${judge.id}`] = {};
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      }

                      setscoresfemale({ ...tempJudgeHolder });
                    });
                  }
                });
            });
            var finalScore = {};
            Object.keys(scoresStatefemale).forEach((key) => {
              // console.log(scores, key);
              Object.keys(scoresStatefemale[key]).forEach((subKey) => {
                if (finalScore[subKey]) {
                  finalScore[subKey] += scoresStatefemale[key][subKey];
                } else {
                  finalScore[subKey] = scoresStatefemale[key][subKey];
                }
              });
            });
            setfinalScorefemale(finalScore);
          }
        });
    });
  };
  //move to current contestant
  const Move = (indecator, gendre) => {
    if (gendre === "male") {
      // if (maleIndex + indecator > males.length - 1) return;
      setmaleIndex(maleIndex + indecator);
    } else {
      // if (femaleIndex + indecator > females.length - 1) return;
      setfemaleIndex(femaleIndex + indecator);
    }
  };
  //show current Contestant to the judges
  const Submit = (gendre) => {
    gendre === "male"
      ? database
          .collection("currentContestants")
          .doc("male")
          .set(males[maleIndex])
      : database
          .collection("currentContestants")
          .doc("female")
          .set(females[femaleIndex]);
  };
  return (
    <div className="App">
      <div className="nav_bar_container">
        <a href="#round">Round</a>
        <a
          href="#scores"
          onClick={() => {
            // console.log(auth().currentUser.uid);
          }}
        >
          Scores
        </a>
        <a
          href="#logout"
          onClick={() => {
            auth().signOut();
          }}
        >
          Log Out
        </a>
      </div>
      <div className="round" id="round">
        <div className="round_controller">
          <button
            onClick={() => {
              round > 1 &&
                database
                  .collection("Round")
                  .doc("round")
                  .update({ round: round - 1 });
            }}
          >{`<`}</button>
          <h3>Round : {round}</h3>
          <button
            onClick={() => {
              round < 4 &&
                database
                  .collection("Round")
                  .doc("round")
                  .update({ round: round + 1 });
            }}
          >{`>`}</button>
        </div>
        <div className="contestant_info_container">
          <div
            className={`contestant male  ${
              curentmale.ContestantNo === males[maleIndex]?.ContestantNo &&
              "sameContestant"
            }`}
            onSubmit={Submit}
          >
            {males[maleIndex] !== undefined ? (
              <>
                <h3 onClick={() => console.log(maleIndex)}>Male Contestants</h3>
                <span>
                  Contestant number : {males[maleIndex]?.ContestantNo}
                </span>
                <h4 id="contestant_name">{`${males[maleIndex]?.firstName} ${males[maleIndex]?.lastName}`}</h4>
                <h4 id="contestant_name">
                  From {males[maleIndex]?.Nationality}
                </h4>

                <div className="form_buttons">
                  {maleIndex !== 0 && (
                    <button
                      onClick={() => {
                        Move(-1, "male");
                      }}
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => {
                      Submit("male");
                    }}
                  >
                    Show
                  </button>

                  <button
                    onClick={() => {
                      Move(1, "male");
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>No Male Contestant Available</span>
                <div className="form_buttons">
                  <button
                    onClick={() => {
                      Move(-1, "male");
                    }}
                  >
                    Previous
                  </button>
                </div>
              </>
            )}
          </div>
          <div
            className={`contestant female  ${
              curentfemale.ContestantNo ===
                females[femaleIndex]?.ContestantNo && "sameContestant"
            }`}
            onSubmit={Submit}
          >
            {females[femaleIndex] !== undefined ? (
              <>
                <h3
                  onClick={() => {
                    console.log(females.length);
                  }}
                >
                  Female Contestants
                </h3>
                <span>
                  Contestant number : {females[femaleIndex]?.ContestantNo}
                </span>
                <h4 id="contestant_name">{`${females[femaleIndex]?.firstName} ${females[femaleIndex]?.lastName}`}</h4>
                <h4 id="contestant_name">
                  From {females[femaleIndex]?.Nationality}
                </h4>

                <div className="form_buttons">
                  {femaleIndex !== 0 && (
                    <button
                      onClick={() => {
                        Move(-1, "female");
                      }}
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => {
                      Submit("female");
                    }}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => {
                      Move(1, "female");
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>No Female Contestant Available</span>
                <div className="form_buttons">
                  <button
                    onClick={() => {
                      Move(-1, "female");
                    }}
                  >
                    Previous
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="scores fullscreen" id="scores">
        {/* <div className="left">
          <span onClick={() => setmodalIsOpen(true)}>
            After Calculating The current round score You select only top
            Contestants to the next round
          </span>
          <button
            disabled={(round !== 2) & (round !== 4)}
            // onClick={() => {
            //   const temp = getTop(round === 2 ? 10 : round === 4 ? 3 : 500);
            //   if (Array.isArray(temp)) {
            //     settop(temp);
            //     // console.log(temp);
            //     if (round === 4) {
            //       //modal open with winners
            //       setmodalIsOpen(true);
            //     } else {
            //       //show alert of the top 10
            //       setmodalIsOpen(true);
            //     }
            //   } else {
            //     alert(temp);
            //   }
            // }}
          >
            {round === 2
              ? `Move top 10 to the next round`
              : round === 4
              ? `select the winners`
              : `you need to be in round 2 or 4`}
          </button>
          
        </div> */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => {
            setmodalIsOpen(false);
          }}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <div className="modal">
            <div className="modal_header">
              <h2 onClick={() => console.log(top)}>
                {round < 3 ? "Top 10" : `the winners`}
              </h2>
              <button onClick={() => setmodalIsOpen(false)}>x</button>
            </div>
            <div className="winners">
              {top.map((winner, index) => {
                return (
                  <span>
                    {`${placementtext(index + 1)} - `}{" "}
                    <b>{` ${winner.firstName} ${winner.lastName} `}</b>{" "}
                  </span>
                );
              })}
            </div>
            {round < 3 && (
              <button
                onClick={() => {
                  registerTopQualified();
                }}
              >
                Move Top 5
              </button>
            )}
          </div>
        </Modal>
        <div className="right">
          <div className="middle">
            <span>
              Calculate current round
              {round === 2
                ? ` 1 and 2 `
                : round === 4
                ? ` 3 and 4 `
                : ` ${round} `}
              scores
            </span>
            <button onClick={currentRoundScoresCalculator}>Calculate</button>
          </div>
          <div className={"contestants"}>
            <div className="males">
              {(round === 2 || round === 4) && (
                <button
                  onClick={() => {
                    const theReturn = getTopmales();
                    if (Array.isArray(theReturn)) {
                      settopmales(theReturn);
                      setCurrentGendre("male");
                      settop(theReturn);
                      setmodalIsOpen(true);
                    } else {
                      console.log(theReturn);
                    }
                  }}
                >
                  {round < 3 ? `get Top 5 males` : `get the winners`}
                </button>
              )}
              {JSON.stringify(finalScoreStatemale) !== "{}" ? (
                <>
                  <h5>
                    Males Contestants Order by points
                    <br />
                  </h5>
                  {Object.keys(finalScoreStatemale)
                    .sort(
                      (a, b) => finalScoreStatemale[a] - finalScoreStatemale[b]
                    )
                    .reverse()
                    .map((key, index) => {
                      if (round > 2) {
                        if (index < 5)
                          return (
                            <span key={`male${key}`}>
                              {/* {JSON.stringify(finalScoreState[key])} */}
                              {placementtext(index + 1)} : Contestant No{" "}
                              {Number(key)} - total points{" "}
                              {finalScoreStatemale[key]}
                            </span>
                          );
                        return undefined;
                      } else {
                        return (
                          <span key={`male${key}`}>
                            {/* {JSON.stringify(finalScoreState[key])} */}
                            {placementtext(index + 1)} : Contestant No{" "}
                            {Number(key)} - total points{" "}
                            {finalScoreStatemale[key]}
                          </span>
                        );
                      }
                      // return (
                      //   <span key={`male${key}`}>
                      //     {/* {JSON.stringify(finalScoreState[key])} */}
                      //     {placementtext(index + 1)} : Contestant No{" "}
                      //     {Number(key)} - total points{" "}
                      //     {finalScoreStatemale[key]}
                      //   </span>
                      // );
                    })}
                </>
              ) : (
                <h5>Press Calculate To show male Contestants in order</h5>
              )}
            </div>
            <div className="females">
              {(round === 2 || round === 4) && (
                <button
                  onClick={() => {
                    const theReturn = getTopfemales();
                    if (Array.isArray(theReturn)) {
                      settopfemales(theReturn);
                      setCurrentGendre("female");
                      settop(theReturn);
                      setmodalIsOpen(true);
                    } else {
                      console.log(theReturn);
                    }
                  }}
                >
                  {round < 3 ? `get Top 5 females` : `get the winners`}
                </button>
              )}
              {JSON.stringify(finalScoreStatefemale) !== "{}" ? (
                <>
                  <h5
                    onClick={() => {
                      alert(Object.keys(finalScoreStatefemale).length);
                    }}
                  >
                    Females Contestants Order by points
                  </h5>
                  {Object.keys(finalScoreStatefemale)
                    .sort(
                      (a, b) =>
                        finalScoreStatefemale[a] - finalScoreStatefemale[b]
                    )
                    .reverse()
                    .map((key, index) => {
                      if (round > 2) {
                        if (index < 5)
                          return (
                            <span key={`female${key}`}>
                              {/* {JSON.stringify(finalScoreState[key])} */}
                              {placementtext(index + 1)} : Contestant No{" "}
                              {Number(key)} - total points{" "}
                              {finalScoreStatefemale[key]}
                            </span>
                          );
                        return undefined;
                      } else {
                        return (
                          <span key={`female${key}`}>
                            {/* {JSON.stringify(finalScoreState[key])} */}
                            {placementtext(index + 1)} : Contestant No{" "}
                            {Number(key)} - total points{" "}
                            {finalScoreStatefemale[key]}
                          </span>
                        );
                      }
                    })}
                </>
              ) : (
                <h5>Press Calculate To show female Contestants in order</h5>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;

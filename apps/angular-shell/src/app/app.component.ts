import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlaskitEditorHostComponent } from './atlaskit-editor-host.component';
import { AtlaskitNavigationHostComponent } from './atlaskit-navigation-host.component';

type ADFDoc = {
  version: 1;
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
};

type EditorMode = 'editor' | 'renderer';

type VersionedADFDocument = {
  version: number;
  updatedAt: string;
  doc: ADFDoc;
};

const INITIAL_DOCUMENT: ADFDoc = {
  "type": "doc",
  "content": [
    {
      "type": "bulletList",
      "attrs": {
        "localId": "99702c65-452d-4822-a5c3-64256de46b31"
      },
      "content": [
        {
          "type": "listItem",
          "attrs": {
            "localId": "70bce589-8970-40f9-b12c-6fb1fa31ccac"
          },
          "content": [
            {
              "type": "paragraph",
              "attrs": {
                "localId": "cfd59a1f-9048-427a-b00d-7860d13d74bf"
              },
              "content": [
                {
                  "text": "When JS Loads in browser , it goes through two phases",
                  "type": "text"
                }
              ]
            },
            {
              "type": "bulletList",
              "attrs": {
                "localId": "6685f255-9b24-4a52-8e7c-e7d9dea8da93"
              },
              "content": [
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "89ed4fae-bc6e-4062-bed3-0eefe371b466"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "958dda93-9e41-429a-b915-b7fce63d060d"
                      },
                      "content": [
                        {
                          "text": "compilation phase",
                          "type": "text"
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "66584cec-4c70-4686-bf06-b14d7c638f5f"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "fc97082b-be42-4119-a728-a78a7d543529"
                      },
                      "content": [
                        {
                          "text": "Execution Phase",
                          "type": "text"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "attrs": {
            "localId": "a978df0c-8a7c-4d5f-9119-489a7290fffc"
          },
          "content": [
            {
              "type": "paragraph",
              "attrs": {
                "localId": "accf446f-ca0b-434d-83ed-ebc3efbba9f6"
              },
              "content": [
                {
                  "text": "Compilation Phase / Creation Phase",
                  "type": "text",
                  "marks": [
                    {
                      "type": "strong"
                    }
                  ]
                }
              ]
            },
            {
              "type": "bulletList",
              "attrs": {
                "localId": "32b58b77-ae68-437a-8029-0b42a7b85d8f"
              },
              "content": [
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "448f4d13-f191-451e-910f-43b0ed1a1637"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "8cd01d48-183d-4ce5-91f3-fb30c2c79d0c"
                      },
                      "content": [
                        {
                          "text": "This is the phase where occurs before the code execution and where memory is allocate , scope created and variables are hoisted and TDZ is applied",
                          "type": "text"
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "62291872-3708-480c-8c08-724d842857d5"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "abf4efe8-ece7-4fe2-8e2b-7f48f25f5f45"
                      },
                      "content": [
                        {
                          "text": "Compilation:",
                          "type": "text",
                          "marks": [
                            {
                              "type": "strong"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "type": "bulletList",
                      "attrs": {
                        "localId": "eb7e1ee0-c711-496e-9127-3a5ed8645679"
                      },
                      "content": [
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "fcfdc303-cc62-4824-a1f5-9e54791301d6"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "5580218c-eebd-4143-8878-1a7f535618c4"
                              },
                              "content": [
                                {
                                  "text": "It is a internal process of engine where ",
                                  "type": "text"
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "8739bc97-e385-4549-89a2-0a6e37431517"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "9d8e8db4-a183-4aa8-b670-8234e559c818"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "6fd073de-546e-4543-9250-c6f84c71b2e8"
                                      },
                                      "content": [
                                        {
                                          "text": "it reads the code",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "019ce90c-c930-49f7-b5fc-d1ab6ed45dab"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "adff73dd-05db-4830-aec5-b0ba5b803e36"
                                      },
                                      "content": [
                                        {
                                          "text": "parses it",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "ccf8bbce-3643-4ca5-8194-6292cf270625"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "7adb5da0-27ec-400e-8982-8bdff827e122"
                                      },
                                      "content": [
                                        {
                                          "text": "creates an abstract syntax tree",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "1d3e7071-f526-4ca7-92f0-d04a0f938bec"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "a0669e41-de64-42ad-ae27-37c6c5e24902"
                                      },
                                      "content": [
                                        {
                                          "text": "allocates memory for variables and functions",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "2f3d68c3-72ae-4967-a3c3-c186e0a73cef"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "4c5d714a-cd8c-41f9-b4dc-11247fb49c89"
                                      },
                                      "content": [
                                        {
                                          "text": "sets up scope,hoisting, TDZ",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "59858a5c-76ef-47ac-adb5-2fde220dadea"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "d50e3fe7-685e-4c4e-97b2-f4861cd0a889"
                                      },
                                      "content": [
                                        {
                                          "text": "totally prepares code for execution",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "3774aea5-89bc-437a-8adc-b55135486555"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "b9379ea5-4c10-44d6-8b01-ac017365692e"
                              },
                              "content": [
                                {
                                  "text": "Abstract Syntax Tree(AST)",
                                  "type": "text",
                                  "marks": [
                                    {
                                      "type": "strong"
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "b77fb95a-6a00-40be-b664-c65e5ff9ffa6"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "f8866104-a3ff-4f0f-afb0-532084706de9"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "87c5afb3-9c7e-49e1-b41e-a765c10aa7cc"
                                      },
                                      "content": [
                                        {
                                          "text": "When JS code loads, engine can’t execute because it is in plain text",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "1f3d28c3-139a-473f-b46c-139b901459a5"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "803159e8-d7e2-4b01-94a2-912c69e902d2"
                                      },
                                      "content": [
                                        {
                                          "text": "so engine parses your code and prepares structure format called AST",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "471a908c-6326-464b-95c1-a8eaebca23dc"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "709ae80f-8d52-4d12-b692-0ee48ddd3a35"
                                      },
                                      "content": [
                                        {
                                          "text": "Steps in AST",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "strong"
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "bb08325d-7b2e-463f-99f8-76a666bb529a"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "ac1f9b45-c827-4de2-9047-84827d7e9f45"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "e3c471a0-3d09-425f-b5ae-32d1305a9c2e"
                                              },
                                              "content": [
                                                {
                                                  "text": "Tokenization",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": ":",
                                                  "type": "text"
                                                }
                                              ]
                                            },
                                            {
                                              "type": "bulletList",
                                              "attrs": {
                                                "localId": "f9e8fb41-bffe-4b78-a4c8-d733090d1b10"
                                              },
                                              "content": [
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "1cd7917e-6f67-43b8-b1e9-decf4dc51e17"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "4757f6a6-6886-4b8a-84c5-2f70e5ded6bf"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "Code is broken into small pieces called “tokens”.",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    },
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "24c4c322-9a1c-4d74-8206-3a1299805e1d"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "Example:",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "type": "hardBreak"
                                                        },
                                                        {
                                                          "text": "let x = 10;",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "hardBreak"
                                                        },
                                                        {
                                                          "text": "Tokens: ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "let",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": ", ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "x",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": ", ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "=",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": ", ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "10",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": ", ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": ";",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "code"
                                                            }
                                                          ]
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "6071309a-8bd9-46b8-a498-d94d3c5932bc"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "53dafa3d-cfed-441a-91e3-c7a99b11180f"
                                              },
                                              "content": [
                                                {
                                                  "text": "Parsing",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                }
                                              ]
                                            },
                                            {
                                              "type": "bulletList",
                                              "attrs": {
                                                "localId": "e47d0bb9-c3b6-4cbe-b004-f9da14fe69af"
                                              },
                                              "content": [
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "54dbe658-eb81-4bfe-8107-8d8052825906"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "9560412e-6aec-4873-ad32-3fd1c513b414"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "The parser takes tokens and organizes them into a syntax structure.",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "a2710f5b-078a-430d-bc7c-f6b39ecb17df"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "9c290b30-3e6c-4ea4-ae28-67f25c3a0f6e"
                                              },
                                              "content": [
                                                {
                                                  "text": "AST Generation",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                }
                                              ]
                                            },
                                            {
                                              "type": "bulletList",
                                              "attrs": {
                                                "localId": "845d9e9d-01f3-4cdc-a80a-6fd44c18dff7"
                                              },
                                              "content": [
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "2bfb3844-3d3a-442a-b162-8f6a9218122c"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "feb91abd-a6e5-4fdc-873e-5db880e4bdde"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "The parser outputs a ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "tree",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "strong"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": " where each node represents:",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    },
                                                    {
                                                      "type": "bulletList",
                                                      "attrs": {
                                                        "localId": "bd9fe137-a11a-42ac-9483-634f58480669"
                                                      },
                                                      "content": [
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "4f86b901-a8ba-4d34-a356-765c9adbc5a9"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "a0e8f78c-1dfc-4fa9-9130-82675d6ceb2c"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "a variable",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "8e9d6d08-371d-405d-9e46-756dfdc85533"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "61afc06b-0c78-4f49-b8ce-37f9ee6abfc6"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "a literal",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "6e807219-79ca-4d6c-8540-16ea5142199c"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "62c4bc30-05fc-4d12-946f-b1bd7c2730b0"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "an operator",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "fd9eba6c-309a-40a6-a51c-4f299cc123bb"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "65c2f03a-818b-4e18-819d-68c16eb6f898"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "a function",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "ae576382-8e15-4900-852f-aab5d9b7b31f"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "3d1696ae-3ce8-457e-bda0-465845ce1c56"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "a block",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "type": "listItem",
                                                          "attrs": {
                                                            "localId": "f9ee4b3f-b386-4b0c-aa46-62b121a36b0a"
                                                          },
                                                          "content": [
                                                            {
                                                              "type": "paragraph",
                                                              "attrs": {
                                                                "localId": "0962e7ee-69e3-4f47-8123-ec58bb844c01"
                                                              },
                                                              "content": [
                                                                {
                                                                  "text": "a statement",
                                                                  "type": "text"
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "ee8446f4-8d8f-487b-9db5-f8b091e3ee68"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "codeBlock",
                                                      "attrs": {
                                                        "localId": "275712a9-f607-41e2-a7cd-a7bc078e810a"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "{\n  \"type\": \"Program\",\n  \"start\": 0,\n  \"end\": 8,\n  \"body\": [\n    {\n      \"type\": \"VariableDeclaration\",\n      \"start\": 0,\n      \"end\": 8,\n      \"declarations\": [\n        {\n          \"type\": \"VariableDeclarator\",\n          \"start\": 4,\n          \"end\": 8,\n          \"id\": {\n            \"type\": \"Identifier\",\n            \"start\": 4,\n            \"end\": 5,\n            \"name\": \"x\"\n          },\n          \"init\": {\n            \"type\": \"Literal\",\n            \"start\": 6,\n            \"end\": 8,\n            \"value\": 10,\n            \"raw\": \"10\"\n          }\n        }\n      ],\n      \"kind\": \"let\"\n    }\n  ],\n  \"sourceType\": \"module\"\n}",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "075026bc-58a2-4494-b99a-3d8fda2f410e"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "154a4127-28d0-4996-887b-11a5aaf5bdcb"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "This code tells that this is Let kind an value inside it to the engine",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "ffd9f210-1207-4805-adb1-b35dfb2dba7f"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "9027fa16-3997-4e3b-8368-9e61ef8ab63a"
                                                      },
                                                      "content": [
                                                        {
                                                          "type": "inlineCard",
                                                          "attrs": {
                                                            "localId": "ca965652-491d-46e4-b28f-c2b8d2efaf75",
                                                            "url": "https://astexplorer.net/"
                                                          }
                                                        },
                                                        {
                                                          "text": " ",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "6b2287db-1eb6-4a7b-98db-bdce1fafe374"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "d6ea4214-1b0c-471e-bcd1-7bc0c8e1e7ee"
                              },
                              "content": [
                                {
                                  "text": "Temporal Dead Zone",
                                  "type": "text",
                                  "marks": [
                                    {
                                      "type": "strong"
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "18e5859d-f137-4837-9d34-ff900daf6107"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "feedc8d0-64e3-47be-a225-0ce120bf697d"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "0a1a6b9f-df95-49eb-9fd4-cbdb0f411c90"
                                      },
                                      "content": [
                                        {
                                          "text": "TDZ is the time period between",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "06dd296c-4647-4e4c-adb8-1dd9c3fba045"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "0dd07301-4fb7-4422-bef4-6c4076ece359"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "0f3a3db4-09d4-4397-8598-0619c8a26434"
                                              },
                                              "content": [
                                                {
                                                  "text": "The moment JavaScript allocates memory for a variable (during the compilation/creation phase)",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "0db3e0b4-1e83-4df0-bb1a-de1bd548c48b"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "5c2b775e-fc81-4ef8-9fd2-0f8531fe7cb3"
                                              },
                                              "content": [
                                                {
                                                  "text": "The moment that variable is actually initialized during execution",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "9de1c50b-3721-48d4-a097-2079290e916f"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "6d362104-411a-4edd-ae29-1890e5a1d03b"
                                      },
                                      "content": [
                                        {
                                          "text": "During this period, the variable exists in memory, but it is ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "not initialized",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "strong"
                                            }
                                          ]
                                        },
                                        {
                                          "text": ", so you ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "cannot access it",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "strong"
                                            }
                                          ]
                                        },
                                        {
                                          "text": ".",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "c6dea40f-67cc-4a2b-966f-558cd5fca9bb"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "e05543aa-b89b-42dd-b48b-e05abdd6d971"
                                      },
                                      "content": [
                                        {
                                          "text": "The moment that variable is actually initialized during execution",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "strong"
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "90b92395-bc6f-4cbc-b064-e15fb5ca7486"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "c3ced794-fb2e-4421-964c-b8ff1e698d57"
                                      },
                                      "content": [
                                        {
                                          "text": "This applies only to:",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "3fb0c3f6-e4e8-40e7-acc5-44b01f7d28bf"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "43da24de-943c-41e7-aa2f-7d8b0dd98fce"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "e30c0bcb-4711-4c7b-bf6b-de42b0633d8b"
                                              },
                                              "content": [
                                                {
                                                  "text": "let",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "code"
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "643d779d-6052-435e-9ede-99845d660039"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "cb4ab50e-2b1e-4bf8-afba-50dbc7267bdc"
                                              },
                                              "content": [
                                                {
                                                  "text": "const",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "code"
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "f811bc02-f98c-4193-bcf3-00f42b4df22a"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "2baa1894-4511-40c0-9572-091c768a9591"
                                              },
                                              "content": [
                                                {
                                                  "text": "class declarations",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "33bef6df-45b8-4a4b-9fa8-b828c672319d"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "5f1c1ad1-da4d-4cce-8fe2-f9eecceaacb0"
                                              },
                                              "content": [
                                                {
                                                  "text": "import bindings",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "7fc7249b-d1ef-4412-9e27-e1092b370224"
                                      },
                                      "content": [
                                        {
                                          "text": "It does ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "not",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "em"
                                            }
                                          ]
                                        },
                                        {
                                          "text": " apply to ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "var",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": ".",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "be9db285-b20d-4b28-87ec-7d7794ca727e"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "b0250036-edbc-4748-87a6-3f6e99fef654"
                                      },
                                      "content": [
                                        {
                                          "text": "Why TDZ called “Temporal” and “Dead Zone”?",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "0cec14a9-31c6-494e-80c5-82b751103de9"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "9fbd380a-1775-4c31-974a-efc944344422"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "58fca2a9-26c6-437c-8d16-ceccc8c6b325"
                                              },
                                              "content": [
                                                {
                                                  "text": "Temporal",
                                                  "type": "text"
                                                }
                                              ]
                                            },
                                            {
                                              "type": "bulletList",
                                              "attrs": {
                                                "localId": "70bb8d65-3e0d-4709-8e73-ad8be4d6a3aa"
                                              },
                                              "content": [
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "227e8705-ada4-445e-9fbf-5b14126d57d6"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "d16c59af-75de-4b40-b36e-f251bb0b92ac"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "Because the restriction lasts for a ",
                                                          "type": "text"
                                                        },
                                                        {
                                                          "text": "time period",
                                                          "type": "text",
                                                          "marks": [
                                                            {
                                                              "type": "strong"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "text": ", not a location.",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "8817647f-205c-407b-ba39-e00d6a1a07e1"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "3fa88fab-4065-4e6f-a76c-d51b14c61092"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "It begins at the start of scope creation and ends at the declaration line.",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "bcc2024e-3b57-4735-8773-65aafe491091"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "e123fc47-5c2c-4ae9-ad27-6083484f8629"
                                              },
                                              "content": [
                                                {
                                                  "text": "Dead Zone",
                                                  "type": "text"
                                                }
                                              ]
                                            },
                                            {
                                              "type": "bulletList",
                                              "attrs": {
                                                "localId": "edf4fb56-9602-45d0-905d-4a1a8a94915f"
                                              },
                                              "content": [
                                                {
                                                  "type": "listItem",
                                                  "attrs": {
                                                    "localId": "fac76e78-fa43-4b65-bc31-a46d00c47017"
                                                  },
                                                  "content": [
                                                    {
                                                      "type": "paragraph",
                                                      "attrs": {
                                                        "localId": "03bca78f-abec-458b-89e4-1482465596da"
                                                      },
                                                      "content": [
                                                        {
                                                          "text": "Because any access during this time is “dead” — not allowed.",
                                                          "type": "text"
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "3f1cf796-1925-4170-b26d-d071cf48bb94"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "3051d985-30d2-496a-919c-fee61920da84"
                                              },
                                              "content": [
                                                {
                                                  "text": "It’s not a place in memory.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "b3a2e3c9-725e-4c6c-a208-deba17bcb9c2"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "435e5de3-b94c-4dbb-bbe2-5638e762d3e6"
                                              },
                                              "content": [
                                                {
                                                  "text": "It is a ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "timeline",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " during code execution.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "bac2d17c-6824-4f76-906a-b748d1460b50"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "d52b1b7f-45b7-4033-9eb0-fbf8546bcb2d"
                                      },
                                      "content": [
                                        {
                                          "text": "TDZ solves several problems that existed with ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "var",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": " hoisting.",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "9507bde5-5e8f-4e01-8792-d20c70cc70aa"
                                      },
                                      "content": [
                                        {
                                          "text": "var",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": " variables were hoisted and initialized to ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "undefined",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": ".",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "4cdc5eb8-95ae-49ba-97c9-b53419903885"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "6e0d4119-098f-4627-8594-3a2af47d2908"
                                      },
                                      "content": [
                                        {
                                          "text": "To fix such design problems, ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "let",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": " and ",
                                          "type": "text"
                                        },
                                        {
                                          "text": "const",
                                          "type": "text",
                                          "marks": [
                                            {
                                              "type": "code"
                                            }
                                          ]
                                        },
                                        {
                                          "text": " must:",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "a05e790a-df2d-457b-ae45-df330ef2b05d"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "10b513e9-39a2-4ec3-a761-54ba5236ec1e"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "6e01c167-e14b-48c6-836c-94f3696cc212"
                                              },
                                              "content": [
                                                {
                                                  "text": "exist in memory ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "before",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " execution (because of hoisting)",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "dd4617a2-e1e3-48d8-9d03-8f3491c86b65"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "52c54c6f-f829-4e94-9744-0f401f1f4453"
                                              },
                                              "content": [
                                                {
                                                  "text": "but remain ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "unusable",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " until initialization",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "6a372455-1709-4f69-b4f3-b0008e263804"
                                      },
                                      "content": [
                                        {
                                          "text": "This avoids accidental use of variables before they are read",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "3cd4a01e-1c5c-493f-bbc5-df69e0c114d5"
                                  },
                                  "content": [
                                    {
                                      "type": "codeBlock",
                                      "attrs": {
                                        "language": "markdown",
                                        "localId": "f87a72bb-2f0b-4b03-993a-e4bcc81b44e1"
                                      },
                                      "content": [
                                        {
                                          "text": "console.log(a);\nlet a = 10;\n\nDuring Compilation (before execution)\n\nJS allocates memory for a\n\nBut a is not initialized\n\na is placed in the uninitialized region of its lexical environment\n→ this is TDZ\n\nDuring Execution (line-by-line)\n\nconsole.log(a)\n→ engine checks the lexical environment\n→ sees a exists but is uninitialized\n→ throws ReferenceError: Cannot access 'a' before initialization\n\nExecution reaches let a = 10\n→ now a is initialized\n→ TDZ ends\n→ a = 10",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "attrs": {
            "localId": "04e3d129-1740-4dba-a4b9-a45a9c9b2266"
          },
          "content": [
            {
              "type": "paragraph",
              "attrs": {
                "localId": "e8fc238f-3cc9-49d4-9713-44cba8aeddd5"
              },
              "content": [
                {
                  "text": "Execution Phase",
                  "type": "text",
                  "marks": [
                    {
                      "type": "strong"
                    }
                  ]
                }
              ]
            },
            {
              "type": "bulletList",
              "attrs": {
                "localId": "5fd8d457-5c21-49fc-bc08-cb762cbabf71"
              },
              "content": [
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "0f9f789e-645d-45ec-9891-ee6680ccb965"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "5b7cf3eb-e874-4c3e-bfe3-6d66fe75c9f9"
                      },
                      "content": [
                        {
                          "text": "Once the entire script has gone through the creation phase, JS begins executing code.",
                          "type": "text"
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "listItem",
                  "attrs": {
                    "localId": "09bd732a-2e42-46a2-b9d7-fdeeb7869701"
                  },
                  "content": [
                    {
                      "type": "paragraph",
                      "attrs": {
                        "localId": "da17990e-2f84-44ce-a69e-e0fcaca010d6"
                      },
                      "content": [
                        {
                          "text": "During this phase:",
                          "type": "text"
                        }
                      ]
                    },
                    {
                      "type": "bulletList",
                      "attrs": {
                        "localId": "94e3d6df-6c14-4663-a37e-5c8de31b4941"
                      },
                      "content": [
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "6dfebc0a-67ae-4bd8-b425-e4fe123b3bd9"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "e22e397b-432e-47e4-8a2a-b766eefe2cac"
                              },
                              "content": [
                                {
                                  "text": "JS runs the code line by line.",
                                  "type": "text"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "d12631fa-fcef-4e1f-9ead-1c98ca0b5d4e"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "04dadbd4-284a-4bb8-b0f2-62ca05523f8c"
                              },
                              "content": [
                                {
                                  "text": "When it sees a variable initialization:",
                                  "type": "text"
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "67e8d3ac-6200-4da1-93d3-e819aa4f3f72"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "53eeb244-351e-4f3e-ac93-6770ec87388c"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "ff3088ad-d9a6-4f78-93df-3baaf5037f4e"
                                      },
                                      "content": [
                                        {
                                          "text": "For var: value is assigned (it was already undefined)",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "7a368085-bd91-40b4-8c2a-0e38b7156c9a"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "722e8b25-3c41-455f-8a97-104a528649c0"
                                      },
                                      "content": [
                                        {
                                          "text": "For let/const: initialization is completed and TDZ ends",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "37d9219c-297a-4e55-8f34-a6e221e15830"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "944dc875-91ba-4b6d-a255-3a62161c1d54"
                              },
                              "content": [
                                {
                                  "text": "When JS encounters objects or arrays:",
                                  "type": "text"
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "95b8bd20-0c78-4b70-88d1-41ee3041be29"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "72fe2ef7-410f-405b-b938-5664f067fd1a"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "ab027abc-6cfa-4e22-95e8-b6a606cd4780"
                                      },
                                      "content": [
                                        {
                                          "text": "JS allocates memory in the heap",
                                          "type": "text"
                                        }
                                      ]
                                    },
                                    {
                                      "type": "bulletList",
                                      "attrs": {
                                        "localId": "b1dc8d5d-3e59-4c34-9782-c2e3f2ae52f8"
                                      },
                                      "content": [
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "ea20596d-52d4-417b-ba0f-1833b7be6f8b"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "f26906e5-aab9-4028-839b-72a7392ffeb3"
                                              },
                                              "content": [
                                                {
                                                  "text": "Heap memory",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " is used for storing ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "objects, arrays, and functions",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": ".",
                                                  "type": "text"
                                                },
                                                {
                                                  "type": "hardBreak"
                                                },
                                                {
                                                  "text": "These values are dynamic in size, so they cannot fit in the stack.",
                                                  "type": "text"
                                                },
                                                {
                                                  "type": "hardBreak"
                                                },
                                                {
                                                  "text": "Instead, the actual object is created in the heap, and the stack stores only a ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "reference",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " to the heap location.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "bc0e4e72-d31e-4031-9c65-938527f21ebd"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "2c7c775e-7686-4694-9282-264e377a34ed"
                                              },
                                              "content": [
                                                {
                                                  "text": "Stack memory",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " is used for storing ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "primitive values",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": " and ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "references (pointers) to objects",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "em"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": ".",
                                                  "type": "text"
                                                },
                                                {
                                                  "type": "hardBreak"
                                                },
                                                {
                                                  "text": "It is fast, organized, and follows a LIFO structure.",
                                                  "type": "text"
                                                },
                                                {
                                                  "type": "hardBreak"
                                                },
                                                {
                                                  "text": "Whenever I declare a primitive like a number or string, the value is stored directly on the stack.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "1321cc6b-07f4-4189-bff5-4824e0c582a3"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "7d43c778-79ca-424a-ba3c-d5ec06def29c"
                                              },
                                              "content": [
                                                {
                                                  "text": "Because of this model, when I assign an object to another variable, JavaScript copies only the ",
                                                  "type": "text"
                                                },
                                                {
                                                  "text": "reference",
                                                  "type": "text",
                                                  "marks": [
                                                    {
                                                      "type": "strong"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "text": ", not the object.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          "type": "listItem",
                                          "attrs": {
                                            "localId": "1321cc6b-07f4-4189-bff5-4824e0c582a3"
                                          },
                                          "content": [
                                            {
                                              "type": "paragraph",
                                              "attrs": {
                                                "localId": "7d43c778-79ca-424a-ba3c-d5ec06def29c"
                                              },
                                              "content": [
                                                {
                                                  "text": "This means both variables point to the same heap memory, so modifying one variable affects the same underlying object.",
                                                  "type": "text"
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "223b2cd7-596d-4986-8ed5-d3e5f919e7f6"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "1e99d55d-c5bf-4066-b557-94d99cd42265"
                                      },
                                      "content": [
                                        {
                                          "text": "A reference is stored in the stack",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "42aff062-694e-4427-aa3f-ccab500fd88d"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "fdc47216-5dc7-4c42-b787-d17feddd66fe"
                              },
                              "content": [
                                {
                                  "text": "When JS calls a function:",
                                  "type": "text"
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "e6005844-e0c3-4531-ae29-9541283ea62f"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "8d9633ae-4eb6-4da4-9df2-bcfb3a76e673"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "f20e4ba6-682e-403e-8ab7-b5ab8c38e5b9"
                                      },
                                      "content": [
                                        {
                                          "text": "A new Function Execution Context (FEC) is created",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "20a808a4-cd2a-465c-bc4d-9b5bde2db108"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "08367d63-dd82-4bd9-9bec-5f7c8ec1b126"
                                      },
                                      "content": [
                                        {
                                          "text": "Memory allocation + TDZ happens again for variables inside the function",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "type": "listItem",
                          "attrs": {
                            "localId": "0250d8bd-7bab-4d68-b1f3-b5c489f2799d"
                          },
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "localId": "c992936a-50b0-450a-a033-9a636ca3a9f6"
                              },
                              "content": [
                                {
                                  "text": "When JS enters a block ",
                                  "type": "text"
                                },
                                {
                                  "text": "{ ... }",
                                  "type": "text",
                                  "marks": [
                                    {
                                      "type": "code"
                                    }
                                  ]
                                },
                                {
                                  "text": ":",
                                  "type": "text"
                                }
                              ]
                            },
                            {
                              "type": "bulletList",
                              "attrs": {
                                "localId": "a1e2f4e4-adfd-4d8f-908c-02298ded2afd"
                              },
                              "content": [
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "2ea1bd83-281e-4cb8-b691-b582fe60cdb9"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "76f56e6d-aee2-4bb9-943e-bea82cf40fe1"
                                      },
                                      "content": [
                                        {
                                          "text": "A block scope environment is created (for let/const)",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  "type": "listItem",
                                  "attrs": {
                                    "localId": "841473b9-bd76-421e-8e73-60fd7d9173f6"
                                  },
                                  "content": [
                                    {
                                      "type": "paragraph",
                                      "attrs": {
                                        "localId": "16b5e31e-1d9d-4a22-820b-29c66dfe7e00"
                                      },
                                      "content": [
                                        {
                                          "text": "TDZ applies inside that block",
                                          "type": "text"
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "attrs": {
        "localId": "a153c9b2-e569-4276-ac44-258ccc48d911"
      },
      "marks": [
        {
          "type": "indentation",
          "attrs": {
            "level": 5
          }
        }
      ]
    }
  ],
  "version": 1
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, AtlaskitEditorHostComponent, AtlaskitNavigationHostComponent],
  template: `
    <main class="confluence-shell" [class.confluence-shell-dark]="darkMode()">
      <header class="global-header">
        <div class="global-header-left">
          <button class="grid-button" type="button" aria-label="Open apps">
            <span></span><span></span><span></span><span></span>
          </button>
          <div class="global-brand">
            <span class="global-brand-mark" aria-hidden="true">✦</span>
            <strong>Confluence</strong>
          </div>
        </div>

        <label class="global-search">
          <span aria-hidden="true">⌕</span>
          <input type="text" value="Search" readOnly aria-label="Search" />
        </label>

        <div class="global-header-right">
          <button class="create-button" type="button">+ Create</button>
          <button class="warning-button" type="button">Upgrade</button>
          <button class="plain-icon-button" type="button" aria-label="Notifications">◌</button>
          <button class="plain-icon-button" type="button" aria-label="Help">?</button>
          <button class="plain-icon-button" type="button" aria-label="Settings">⚙</button>
          <span class="header-avatar">S</span>
        </div>
      </header>

      <div class="workspace-shell">
        <aside class="sidebar-shell">
          <app-atlaskit-navigation-host
            [activeItem]="activeNavItem()"
            (itemSelect)="onNavigationSelect($event)">
          </app-atlaskit-navigation-host>
        </aside>

        <section class="page-shell">
          <header class="page-topbar">
            <div class="page-title-strip">
              <button class="plain-icon-button" type="button" aria-label="Expand page menu">
                <span aria-hidden="true">&#9662;</span>
              </button>
              <span class="page-icon" aria-hidden="true">&#9635;</span>
              <strong>{{ documentTitle }}</strong>
            </div>

            <div class="page-actions">
              <span class="edited-date">Edited Dec 12, 2025</span>
              <span class="avatar-stack" aria-label="Collaborators">
                <span class="avatar">S</span>
                <span class="avatar avatar-small">S</span>
              </span>
              <button class="primary-button" type="button">Update</button>
              <button class="primary-button primary-button-caret" type="button" aria-label="More update actions">&#9662;</button>
              <button class="plain-button" type="button" (click)="toggleMode()">Close</button>
              <button class="share-button" type="button"><span aria-hidden="true">&#128274;</span> Share</button>
              <button class="plain-icon-button" type="button" aria-label="Copy link">⌁</button>
              <button class="plain-icon-button" type="button" aria-label="More page actions">...</button>
            </div>
          </header>

          <article class="document-stage">
            <div class="editor-surface-header">
              <div class="editor-surface-mode">
                <button class="surface-tab" type="button" [class.surface-tab-active]="mode() === 'editor'" (click)="setMode('editor')">
                  Write
                </button>
                <button class="surface-tab" type="button" [class.surface-tab-active]="mode() === 'renderer'" (click)="setMode('renderer')">
                  Preview
                </button>
              </div>
            </div>

            <div class="document-page">
              <h1 class="document-title">{{ documentTitle }}</h1>
              <div class="document-meta">
                <span class="author-avatar">S</span>
                <span>By Sumanth</span>
                <span class="meta-item"><span aria-hidden="true">&#128214;</span> 3 min</span>
                <span class="meta-item"><span aria-hidden="true">&#128065;</span> See views</span>
                <span class="meta-item"><span aria-hidden="true">&#9786;</span> Add a reaction</span>
              </div>

              <div class="editor-surface">
                <div class="editor-mode-pill">{{ mode() === 'editor' ? 'EDIT MODE' : 'VIEW MODE' }}</div>
                <app-atlaskit-editor-host
                  [value]="editorData()"
                  [readOnly]="readOnly()"
                  [mode]="mode()"
                  [darkMode]="darkMode()"
                  [debounceMs]="200"
                  (change)="onEditorChange($event)"
                  (editorError)="onEditorError($event)">
                </app-atlaskit-editor-host>
              </div>
            </div>
          </article>
        </section>
      </div>

      <button class="help-button" type="button" aria-label="Help">?</button>
    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly documentTitle = 'How JavaScript code Executes and allocates Memory';
  readonly editorData = signal<ADFDoc>(createInitialDocument());
  readonly activeNavItem = signal('page-current');
  readonly darkMode = signal(false);
  readonly mode = signal<EditorMode>('editor');
  readonly documentVersion = signal(1);
  readonly readOnly = computed(() => this.mode() === 'renderer');

  readonly versionedDocument = computed<VersionedADFDocument>(() => ({
    version: this.documentVersion(),
    updatedAt: new Date().toISOString(),
    doc: this.editorData()
  }));

  readonly serializedDocument = computed(() => JSON.stringify(this.versionedDocument(), null, 2));

  onEditorChange(nextDocument: ADFDoc): void {
    this.editorData.set(structuredClone(nextDocument));
    this.documentVersion.update((version) => version + 1);
  }

  onEditorError(error: unknown): void {
    console.error('Unable to load Atlaskit editor bundle', error);
  }

  onNavigationSelect(itemId: string): void {
    this.activeNavItem.set(itemId);

    if (itemId === 'preview-page') {
      this.mode.set('renderer');
      return;
    }

    if (itemId === 'page-current') {
      this.mode.set('editor');
    }
  }

  toggleMode(): void {
    this.mode.update((mode) => (mode === 'editor' ? 'renderer' : 'editor'));
  }

  setMode(mode: EditorMode): void {
    this.mode.set(mode);
    this.activeNavItem.set('page-current');
  }

  resetDocument(): void {
    this.editorData.set(createInitialDocument());
    this.documentVersion.set(1);
    this.mode.set('editor');
  }
}

function createInitialDocument(): ADFDoc {
  return structuredClone(INITIAL_DOCUMENT);
}

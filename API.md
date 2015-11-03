**/password/isLeaked**
----
  Returns whether a password is in a password list or not.

  Please note that this only checks if the password is literally in the password dictionary. You may want to use
  `/password/test` route which provides more comprehensive password testing.

* **URL**

  /password/isLeaked

* **Method:**

  `POST`

* **Post Body**

  ```
  {
      password: "<password>"
  }```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ isLeaked : true }`

* **Error Response:**

  * **Code:** 400 Bad Request <br />
  **Content:**
     ```
     {
        "type": "UserError",
        "message": "The post body is invalid.",
        "details": [{
            "message": "\"password\" is required",
            "path": "password",
            "type": "any.required",
            "context": {
                "key": "password" }
            }]
    } ```

**/password/isSecure**
----
  Tests a password using OWASP standards, additionally verifies that the password has not been leaked and is not vulnerable to dictionary attacks.
  In order to determine if the password has been leaked or not this method attempts to reproduce
  common modifications users make to passwords (thus rendering them weak to dictionary attacks).
  The method does this by swaping 'a' for '4', '3' for 'e' (among several other combinations) and vice versa,
  hopefully generating a representative set of passwords to then look up against the dictionary.

* **URL**

  /password/isSecure

* **Method:**

  `POST`

* **Post Body**

  ```
  {
      password: "<password>",
      *optional* config: {
        "allowPassphrases"       : true,
        "maxLength"              : 128,
        "minLength"              : 10,
        "minPhraseLength"        : 20,
        "minOptionalTestsToPass" : 3
      }
  }```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
     ```
     {
        "errors": [],
        "failedTests": [],
        "isPassphrase": true,
        "optionalTestErrors": [],
        "optionalTestsPassed": 0,
        "passedTests": [
            0,
            1,
            2
        ],
        "requiredTestErrors": [],
        "strong": true,
        "isLeaked": false,
        "similarPasswords": []
    } ```

    Failed passwords return 200, but with more details.
    Please use response.strong === true to determine if the password is secure or not.

* **Code:** 200 <br />
    **Content:**
    ```
    {
    "errors": [
        "The password has been leaked, making it extremely insecure."
    ],
    "failedTests": [],
    "passedTests": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
    ],
    "requiredTestErrors": [
        "The password has been leaked, making it extremely insecure."
    ],
    "optionalTestErrors": [],
    "isPassphrase": false,
    "strong": false,
    "optionalTestsPassed": 4,
    "isLeaked": true,
    "similarPasswords": [
        {
            "password": "!P@SSW0RD",
            "similarity": 0.8235294117647058
        },
        {
            "password": "!PASSW0RD",
            "similarity": 0.5882352941176471
        },
        {
            "password": "@PASSW0RD@",
            "similarity": 0.5555555555555556
        },
        {
            "password": "$P@55W0RD",
            "similarity": 0.47058823529411764
        },
        {
            "password": "\*PA55W0RD",
            "similarity": 0.35294117647058826
        }
    ]
    } ```


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Content:**
     ```
     {
        "type": "UserError",
        "message": "The post body is invalid.",
        "details": [{
            "message": "\"password\" is required",
            "path": "password",
            "type": "any.required",
            "context": {
                "key": "password" }
            }]
    } ```

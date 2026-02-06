## Working with the server locally

### Installation

> [!NOTE]
> This will work with most recent Python versions, however it is highly recommended that all team members use the same
> Python version and a recent version. The API on the server runs on `Python 3.12`. Simply run `python --version` or
`python3 --version`to check your Python version

To avoid conflicts with existing projects on your local machine, and to ensure that the entire team is developing on the
same environment, virtual environments are used. To do so, do use the following commands:

```powershell
cd server # Do this if you're not already in the server directory
python -m venv venv # You may have to use python3 on MacOS
```

The command above create a virtual environment named `venv`. This will not be pushed to Git as it will only work on the
machine where the command was run. This means that each developer who wants to run the API locally have to create a
virtual environment.

To activate the environment use one of the two commands below (depending on your OS):

```powershell
./venv/Scripts/activate # Windows
source ./venv/bin/activate # MacOS
```

And to install all dependencies use:

```powershell
pip install -r requirements.txt # pip3 if you are on MacOS
```

> [!NOTE]
> Configure your IDE to use the virtual environment you just created as Python interpreter.

### Running the code

The template project have been configured using FastAPI, and a Run- and Debug-configuration for FastAPI have to be
configured for the IDE. There are plenty of tutorials on how to do so, just ensure you set `port 5000` as the default
port. You can also start it from the terminal using the following command:

```powershell
uvicorn main:app --port 5000 --reload 
```

### Installing dependencies and updating requirements

To install a new Python package use

```powershell
pip install <package-name> # pip3 if you are on MacOS 
```

Whenever a dependency is added or removed the [`requirements.txt`](../../server/requirements.txt) **have** to be
updated. This is to ensure that the entire team is developing with the same versions and packages. This will save you a
lot of time further down the road. Addtionally, an up-to-date requirements file is neccecary for the server images to
build and run without errors. The most common error when a dependency is missing is `ModuleNotFoundError`. To update the
`requirements.txt` use

```powershell
pip freeze > requirements.txt # pip3 on MacOS
```
import sys

def main():
    print("-------------------------------------------------------------------")
    print("NOTICE: Historical import via hardcoded dictionary has been disabled.")
    print("The project is now strictly using the provided CSV dataset:")
    print("US_SPOTIFY WEEKLY_CHART.csv")
    print("-------------------------------------------------------------------")
    print("\nTo import data, please use: python3 csv_importer.py")
    sys.exit(0)

if __name__ == "__main__":
    main()

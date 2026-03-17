import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_result(step, response):
    print(f"--- {step} ---")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        if isinstance(data, list):
            print(f"Response: List of {len(data)} items")
            if data:
                print(f"First item: {json.dumps(data[0], indent=2, ensure_ascii=False)}")
        else:
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")
    except Exception as e:
        print(f"Response text: {response.text[:200]}")
    print("\n")

def run_tests():
    print("Starting API Tests...\n")

    # 1. Test Import Excel
    try:
        with open('D:/Work/Bài tập/HumanResource/IBS_Resource Plan_2026.xlsx', 'rb') as f:
            files = {'file': ('IBS_Resource Plan_2026.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            r = requests.post(f"{BASE_URL}/import/excel", files=files)
            print_result("1. Import Excel", r)
    except Exception as e:
        print(f"Error testing import: {e}")

    # 2. Test Dashboard Summary
    r = requests.get(f"{BASE_URL}/dashboard/summary")
    print_result("2. Dashboard Summary", r)

    # 3. Test Resource Table
    r = requests.get(f"{BASE_URL}/dashboard/resource-table")
    print_result("3. Resource Table", r)

    # 4. Test Get Employees
    r = requests.get(f"{BASE_URL}/employees/")
    print_result("4. Get Employees", r)
    
    # 5. Test Get Projects
    r = requests.get(f"{BASE_URL}/projects/")
    print_result("5. Get Projects", r)

    # 6. Test Create Employee
    new_employee = {
        "code": "TEST01",
        "name": "Test Employee",
        "department": "IT",
        "level": "Junior",
        "status": "Active"
    }
    r = requests.post(f"{BASE_URL}/employees/", json=new_employee)
    print_result("6. Create Employee", r)
    emp_id = None
    if r.status_code == 200 or r.status_code == 201:
        emp_id = r.json().get('id')

    # 7. Test Delete Employee
    if emp_id:
        r = requests.delete(f"{BASE_URL}/employees/{emp_id}")
        print_result("7. Delete Employee", r)

if __name__ == "__main__":
    run_tests()

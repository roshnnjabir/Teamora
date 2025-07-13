def serialize_employees(employees):
    return SimpleEmployeeSerializer(employees, many=True).data
import hashlib

def generate_fingerprint(exception_type, stack_trace):
    try:
        hashable_string = str(exception_type)

        for frame in stack_trace:
            hashable_string += str(frame['filename'])
            hashable_string += str(frame['function'])
    except:
        pass

    fingerprint = hashlib.sha256(hashable_string.encode('utf-8'))
    return fingerprint.hexdigest()

# decided that server shouldn't normalise stack trace and changing architecture for sdk to normalise stacktrace
# def normalize_stack_trace(stack_trace: str):
#     stack_trace_lines = stack_trace.strip().split('\n')
#     frames = []
#     for lines in stack_trace_lines:
#         if lines.startswith("File"):
#             frame_items = lines.split(",")
#             file_path = frame_items[0].strip().removeprefix("File").strip()
#             line = frame_items[1].strip()
#             function_name = frame_items[2].strip().removeprefix("in").strip()
#             context = frame_items[3]
#             frame = {
#                 "file_path": file_path,
#                 "line": line,
#                 "function": function_name,
#                 "context": context
#             }
#             frames.append(frame)
#     return frames 
